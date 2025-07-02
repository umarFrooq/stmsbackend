const httpStatus = require('http-status');
const  Branch  = require('./branch.model'); // Assuming Branch model is exported from index.js in the same directory
const Address = require('../address/address.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');
const { slugGenerator } = require('../../config/components/general.methods'); // Assuming this utility exists

/**
 * Create a branch
 * @param {Object} branchData - Data for the branch
 * @param {ObjectId} schoolId - The ID of the school this branch belongs to
 * @returns {Promise<Branch>}
 */
const createBranch = async (branchData, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to create a branch.');
  }

  // TODO: Consider if branchCode uniqueness should be per school or global.
  // Current Branch.isBranchCodeTaken is global. If per school, it needs modification.
  // For now, assuming global uniqueness for branchCode as per existing model static.
  let branchCode = branchData.branchCode;
  if (!branchCode && branchData.name) {
    branchCode = slugGenerator(branchData.name.toUpperCase(), 2);
    if (await Branch.isBranchCodeTakenInSchool(branchCode, schoolId)) {
        branchCode = slugGenerator(`${branchData.name.toUpperCase()}-${Math.floor(Math.random() * 1000)}`, 2);
        if (await Branch.isBranchCodeTakenInSchool(branchCode, schoolId)) {
             throw new ApiError(httpStatus.BAD_REQUEST, 'Generated branch code also conflicts within this school. Please try a unique one.');
        }
    }
  } else if (branchCode && await Branch.isBranchCodeTakenInSchool(branchCode, schoolId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Branch code already taken within this school.');
  }
  
  const branchPayload = {
    ...branchData,
    branchCode,
    schoolId, // Add schoolId to the branch payload
  };

  // Ensure addressId handling remains if it's part of branchData
  // if (branchData.addressId) {
  //   const address = await Address.findById(branchData.addressId);
  //   if (!address) {
  //     throw new ApiError(httpStatus.BAD_REQUEST, 'Address not found');
  //   }
  // }

  return Branch.create(branchPayload);
};

/**
 * Query for branches
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {ObjectId} [schoolId] - Optional: The ID of the school to filter branches by (for rootUser or specific queries)
 * @param {String} [userRole] - Optional: The role of the user making the request
 * @returns {Promise<QueryResult>}
 */
const queryBranches = async (filter, options, schoolId, userRole) => {
  let queryFilter = { ...filter };

  if (userRole !== 'rootUser') { // For any non-root user, schoolId is mandatory from their context
    if (!schoolId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School ID context is required for your role.');
    }
    queryFilter.schoolId = schoolId;
  } else if (schoolId) { // rootUser provided a specific schoolId to filter by
    queryFilter.schoolId = schoolId;
  }
  // If userRole is 'rootUser' and schoolId is not provided, queryFilter does not include schoolId,
  // thus fetching branches from all schools (if that's the desired behavior for root).

  const branches = await Branch.paginate(queryFilter, options);
  return branches;
};

/**
 * Get branch by id
 * @param {ObjectId} id - Branch ID
 * @param {ObjectId} [schoolId] - Optional: School ID for scoping (mandatory for non-root)
 * @param {String} [userRole] - Optional: The role of the user
 * @returns {Promise<Branch>}
 */
const getBranchById = async (id, schoolId, userRole) => {
  let query = {};
  if (userRole === 'rootUser') {
    query._id = id;
    if (schoolId) { // rootUser can optionally scope to a school
      query.schoolId = schoolId;
    }
  } else { // Non-root users must be scoped
    if (!schoolId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School ID context is required for your role.');
    }
    query = { _id: id, schoolId };
  }

  const branch = await Branch.findOne(query);

  if (!branch) {
    const message = (userRole !== 'rootUser' || schoolId)
      ? 'Branch not found or not associated with the specified school.'
      : 'Branch not found.';
    throw new ApiError(httpStatus.NOT_FOUND, message);
  }
  return branch;
};

/**
 * Update branch by id
 * @param {ObjectId} branchId
 * @param {ObjectId} branchId - Branch ID
 * @param {Object} updateBody - Data to update
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Branch>}
 */
const updateBranchById = async (branchId, updateBody, schoolId) => {
  const branch = await getBranchById(branchId, schoolId); // This now ensures the branch belongs to the school

  // Prevent schoolId from being updated
  if (updateBody.schoolId && updateBody.schoolId !== branch.schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of a branch.');
  }
  delete updateBody.schoolId; // Remove schoolId from updateBody to be safe

  // TODO: If branchCode uniqueness is per school, isBranchCodeTaken needs schoolId.
  // Assuming global uniqueness for now.
  if (updateBody.branchCode && (await Branch.isBranchCodeTakenInSchool(updateBody.branchCode, schoolId, branchId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Branch code already taken within this school.');
  }

  if (updateBody.addressId) {
    const address = await Address.findById(updateBody.addressId);
    if (!address) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Address not found for addressId.');
    }
  }

  Object.assign(branch, updateBody);
  await branch.save();
  return branch;
};

/**
 * Delete branch by id and schoolId
 * @param {ObjectId} branchId - Branch ID
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Branch>}
 */
const deleteBranchById = async (branchId, schoolId) => {
  const branch = await getBranchById(branchId, schoolId); // Ensures branch belongs to the school
  await branch.remove();
  return branch;
};

// Branch.statics.isBranchCodeTaken = async function (branchCode, schoolId, excludeBranchId) {
//     const query = { branchCode, schoolId, _id: { $ne: excludeBranchId } };
//     // if schoolId is not provided for global check (e.g. by root user), remove it from query
//     if(!schoolId) delete query.schoolId;
//     const branch = await this.findOne(query);
//     return !!branch;
// };


module.exports = {
  createBranch,
  queryBranches,
  getBranchById,
  updateBranchById,
  deleteBranchById,
};
