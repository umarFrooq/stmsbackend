const ApiError = require('@/utils/ApiError');
const { aggregationPagination, paginationParser } = require('@/utils/generalDB.methods.js/DB.methods');
const mongoose = require('mongoose');
const db = require("../../config/mongoose");
const userModel = db.User;
const { roleTypes, queryTypes } = require("@/config/enums");
const {queryTypeParser,atlasQueryTypeValidation,filterResponse}=require('../../config/components/general.methods')

const usersearchQuery = async (filter, options, search) => {
    const pagination = paginationParser(options);
    const results = queryParser(filter, search)
    const compoundQuery = atlasQueryTypeValidation(results)
    let lookUp = handleLookup(filter)
    let serachQuery= {
        '$search': {
          'index': 'nameSearch',
          'compound': compoundQuery,
          'count': {
            'type': 'total'
          }
        }
      }
      if (!Object.keys(search).length && !search.name && !search.value) {
        serachQuery["$search"]['sort'] = options.sortBy;
      }
    const query = [
        serachQuery,
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
        lookUp.userLookup,
        lookUp.userUnwind,
      { '$project': {
            id: "$_id",
            _id: 0,
            fullname: 1,
            email: 1,
            role: 1,
            phone: 1,
            verificationMethod: 1,
            origin: 1,
            address: {
                address: 1,
                city: 1
            },
            meta:1
        }
    }

    ]
    console.log(JSON.stringify(query))
    const result = await userModel.aggregate(query)
    return filterResponse(result,pagination,options)

}

l
const queryParser = (filter, search) => {
    const filterQuery = [{
        'exists': {
            'path': '_id'
        }
    }];
    const mustQuery = [];
    let shouldQuery = [];
    const mustNot = [];
    if (search && search.name && search.value) {
        let path = filter.lang ? `lang.${filter.lang}.fullname` : 'fullname'
        mustQuery.push(queryTypeParser(search.value, path))
    }
    for (key in filter) {

        if (key === 'city') {

            filterQuery.push(queryTypeParser(filter[key], key));
            continue;
        }
        if (key === 'role') {

            filterQuery.push(queryTypeParser(filter[key], key));
            continue;
        }
           if (key === 'schoolId') {

            filterQuery.push(queryTypeParser(filter[key], key));
            continue;
        }



        if (key === "createdAt") {
            let query = { path: key ,...filter[key] }
            filterQuery.push(queryTypeParser(query, key, queryTypes.RANGE));

            continue;
        }
    }

    return { filterQuery, mustQuery, mustNot, shouldQuery }
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