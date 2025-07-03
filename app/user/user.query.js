const ApiError = require('@/utils/ApiError');
const { aggregationPagination, paginationParser } = require('@/utils/generalDB.methods.js/DB.methods');
const mongoose = require('mongoose');
const db = require("../../config/mongoose");
const userModel = db.User;
const { roleTypes, queryTypes, userStatus } = require("@/config/enums"); // Added userStatus
const {queryTypeParser,atlasQueryTypeValidation,filterResponse}=require('../../config/components/general.methods')

// usersearchQuery now only takes filter and options.
// The 'search' string is expected to be within filter.search
const usersearchQuery = async (filter, options) => {
    const pagination = paginationParser(options);
    // queryParser now takes only filter, it will look for filter.search internally
    const atlasClauses = queryParser(filter);
    const compoundQuery = atlasQueryTypeValidation(atlasClauses); // This function builds the final compound structure

    let searchQueryStage = { // Renamed from serachQuery to avoid confusion with filter.search
        '$search': {
          'index': 'nameSearch', // This index must support searching on fullname, email, phone
          'compound': compoundQuery,
          'count': {
            'type': 'total'
          },
          // Sorting should be handled by Atlas Search if no specific text score sort is needed,
          // or can be part of the compound query. If text relevance is not primary,
          // standard MongoDB sort can be applied after $search if needed, or Atlas sort.
          // For now, relying on options.sortBy to be potentially used by Atlas or later $sort stage.
        }
      };

    // if (!filter.search) { // If no text search, Atlas can use standard MQL sort syntax
    //    searchQueryStage["$search"]['sort'] = options.sortBy;
    // }
    // It's often better to let Atlas handle sorting if possible, or sort after $search.
    // The original code had sort only if search object was empty.
    // For now, let's assume options.sortBy will be handled by Atlas if the index is configured, or a later $sort stage.
    // If Atlas Search's 'sort' option is used, it needs to be in the MQL format like { "fieldName": 1 }

    const query = [
        searchQueryStage,
        {
            '$skip': pagination.skip
        }, {
            '$limit': pagination.limit
        },
        {
            $addFields: {
                'meta': '$$SEARCH_META',
           
            }
          },
        // lookUp.userLookup,
        // lookUp.userUnwind,
      { '$project': {
            id: "$_id",
            _id: 0,
            fullname: 1,
            email: 1,
            role: 1,
            phone: 1,
            verificationMethod: 1,
            origin: 1,
            // address: {
            //     address: 1,
            //     city: 1
            // },
            meta:1,
            branchId: 1, // Ensure branchId is projected to be available for lookup
            status: 1, // Project status as well
        }
    }
    ];

    // Add $lookup for branchId after initial search and pagination stages
    // This is not ideal for performance with $search, $lookup should ideally be before $search if possible,
    // or the data denormalized. But for now, adding it after to get branch name.
    // A better Atlas approach would be to use $lookup within $search if supported by version/config,
    // or index the branch name directly in the user document if frequently needed for searching/display.
    // For now, a standard aggregation $lookup:
    query.push({
        '$lookup': {
            from: 'branches', // The actual name of the branches collection
            localField: 'branchId',
            foreignField: '_id',
            as: 'branchInfo'
        }
    });
    query.push({
        '$unwind': {
            path: '$branchInfo',
            preserveNullAndEmptyArrays: true // Keep users even if branchInfo is not found or branchId is null
        }
    });

    // Final projection including branch name
    query.push({
        '$project': {
            id: "$id", // id was already projected as $_id
            fullname: 1,
            email: 1,
            role: 1,
            phone: 1,
            verificationMethod: 1,
            origin: 1,
            status: 1,
            branchId: { // Re-shape branchId to include name
                _id: "$branchId", // Original branchId
                name: "$branchInfo.name" // Populated name
            },
            // address: { city: 1 }, // Original had this commented out, re-eval if needed
            meta: 1,
        }
    });

    // console.log(JSON.stringify(query)) // Keep for debugging if necessary
    const result = await userModel.aggregate(query)
    return filterResponse(result,pagination,options)

}


// queryParser now takes only filter. It will look for filter.search for text search,
// and other properties like filter.status, filter.role, filter.branchId for filtering.
const queryParser = (filter) => {
    const filterClauses = []; // These are for the 'filter' part of Atlas compound query (exact matches)
    const mustClauses = [];   // These are for the 'must' part (text search, etc.)
    const shouldClauses = []; // For 'should' part, if needed for boosting certain terms

    // Handle generic search term against multiple fields: fullname, email, phone
    // This assumes 'nameSearch' index is configured to search these fields,
    // or we use multiple 'text' queries within a 'should' or 'must' compound clause.
    if (filter.search) {
        // Option 1: Simple text query on multiple fields (if index supports default search on these)
        // mustClauses.push({
        //     "text": {
        //         "query": filter.search,
        //         "path": ["fullname", "email", "phone"] // Atlas index 'nameSearch' must cover these
        //     }
        // });

        // Option 2: More explicit using 'should' to find in any field, effectively an OR
        // This is generally better if you want to find the term in *any* of the specified fields.
        // The 'nameSearch' index should have these fields indexed appropriately (e.g., as text).
        shouldClauses.push({
            "text": { "query": filter.search, "path": "fullname", "fuzzy": { "maxEdits": 1, "prefixLength": 2 } }
        });
        shouldClauses.push({
            "text": { "query": filter.search, "path": "email" } // Email search usually doesn't need fuzzy
        });
        shouldClauses.push({
            "text": { "query": filter.search, "path": "phone", "fuzzy": { "maxEdits": 1 } }
        });
    } else {
      // If no search term, ensure we still have a valid query structure.
      // Adding an "exists" clause for _id is a common way to ensure all documents are considered for filtering.
      filterClauses.push({ 'exists': { 'path': '_id' } });
    }


    // Handle specific field filters (exact matches - these go into Atlas 'filter' or 'must' clause)
    // These should use 'term' or 'equals' for exact matches typically.
    // queryTypeParser likely handles creating the correct Atlas syntax.

    if (filter.role) {
        if (typeof filter.role === 'string' && filter.role.includes(',')) {
            const rolesArray = filter.role.split(',').map(role => role.trim()).filter(role => role);
            if (rolesArray.length > 0) {
                // Use 'terms' for multiple exact matches (Atlas Search equivalent of $in)
                // This assumes queryTypeParser can generate { "terms": { "path": "role", "query": rolesArray } }
                // or we build it manually if queryTypeParser is simple.
                // For simplicity, if queryTypeParser doesn't support 'terms', we can use a 'should' of 'term' queries.
                // Let's assume queryTypeParser or atlasQueryTypeValidation can handle an array for 'terms' like behavior for 'filter' context.
                // If not, this would be:
                // const roleShouldClauses = rolesArray.map(r => ({ "term": { "path": "role", "query": r } }));
                // compoundClause.should = (compoundClause.should || []).concat(roleShouldClauses);
                // compoundClause.minimumShouldMatch = (compoundClause.minimumShouldMatch || 0) + 1; // This logic gets complex with other shoulds.
                // Simpler: add to filterClauses if queryTypeParser handles arrays for 'in' like behavior.
                 filterClauses.push({ "terms": { "path": "role", "query": rolesArray } }); // Directly constructing Atlas 'terms' query
            }
        } else if (filter.role) { // Single role
            filterClauses.push(queryTypeParser(filter.role, 'role', queryTypes.EQUALS));
        }
    }
    if (filter.status) {
        filterClauses.push(queryTypeParser(filter.status, 'status', queryTypes.EQUALS));
    }
    if (filter.branchId && mongoose.Types.ObjectId.isValid(filter.branchId)) {
        const branchObjectId = new mongoose.Types.ObjectId(filter.branchId);
        filterClauses.push(queryTypeParser(branchObjectId, 'branchId', queryTypes.EQUALS));
    }
    if (filter.schoolId && mongoose.Types.ObjectId.isValid(filter.schoolId)) {
        const schoolObjectId = new mongoose.Types.ObjectId(filter.schoolId);
        filterClauses.push(queryTypeParser(schoolObjectId, 'schoolId', queryTypes.EQUALS));
    }
    if (filter.city) { // Assuming city is a direct field or needs specific handling
        filterClauses.push(queryTypeParser(filter.city, 'address.city', queryTypes.EQUALS)); // Example if city is nested
    }
    if (filter.createdAt) { // Date range
        // queryTypeParser needs to correctly format this for Atlas 'range'
        // Example: { range: { path: 'createdAt', gte: dateFrom, lte: dateTo } }
        filterClauses.push(queryTypeParser(filter.createdAt, 'createdAt', queryTypes.RANGE));
    }

    // The atlasQueryTypeValidation function will take these arrays and structure them
    // into the final 'compound' query, e.g., putting filterClauses into 'filter' part,
    // mustClauses into 'must', and shouldClauses into 'should'.
    // If shouldClauses has items (due to filter.search), it might need a minimumShouldMatch: 1.
    let finalQueryStructure = { filter: filterClauses };
    if (mustClauses.length > 0) {
        finalQueryStructure.must = mustClauses;
    }
    if (shouldClauses.length > 0) {
        finalQueryStructure.should = shouldClauses;
        finalQueryStructure.minimumShouldMatch = 1; // Important if using 'should' for OR logic on search terms
    }

    // If filter.search was the only real query part, and it generated only 'should' clauses,
    // we need to ensure the compound query is valid.
    // If 'should' is present, 'filter' or 'must' should also ideally be present or handle empty cases.
    // The atlasQueryTypeValidation likely handles structuring this correctly.
    // For now, returning the arrays for atlasQueryTypeValidation to process.
    // This simplified return assumes atlasQueryTypeValidation will correctly form the compound query:
    return finalQueryStructure;
}







function extractKeyAndDate(queryObject) {
    // Extract the key ($lte or $gte)
    let condition = Object.keys(queryObject)[0];

    // Extract the date string
    const dateString = queryObject[condition];

    condition = condition.slice(1);
    return { condition, dateString };
}
let handleLookup = (filter) => {
    let userLookup = {}
    let userUnwind = {}
    if (filter && Object.keys(filter).length <= 0 || filter.role == roleTypes.USER || filter.role == undefined) {

        userLookup = {
            '$lookup': {
                'from': 'addresses',
                'localField': 'defaultAddress',
                'foreignField': '_id',
                'as': 'address'
            }
        }

        userUnwind = {
            '$unwind': {
                'path': '$address',
                'preserveNullAndEmptyArrays': true
            }
        }
    } else {
        userLookup = {
            '$lookup': {
                'from': 'sellerdetails',
                'localField': '_id',
                'foreignField': 'seller',
                'as': 'address'
            }
        }

        userUnwind = {
            '$unwind': {
                'path': '$address',
                'preserveNullAndEmptyArrays': true
            }
        }

    }
    return { userLookup, userUnwind }
}

module.exports = {
    usersearchQuery,
    queryParser
}