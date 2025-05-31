const httpStatus = require('http-status');
const  {Branch}  = require('./branch.model'); // Assuming Branch model is exported from index.js in the same directory
const Address = require('../address/address.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');
const { slugGenerator } = require('../../config/components/general.methods'); // Assuming this utility exists

/**
 * Create a branch
 * @param {Object} branchBody
 * @returns {Promise<Branch>}
 */
const createBranch = async (branchBody) => {
  // Check if addressId exists
  const address = await Address.findById(branchBody.addressId);
  if (!address) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Address not found');
  }

  // Generate branchCode if not provided
  let branchCode = branchBody.branchCode;
  if (!branchCode && branchBody.name) {
    branchCode = slugGenerator(branchBody.name.toUpperCase(), 2); // Example: "MY-BRANCH-01"
    // Ensure uniqueness if generated (simple check, might need more robust solution for high concurrency)
    if (await Branch.isBranchCodeTaken(branchCode)) {
        branchCode = slugGenerator(`${branchBody.name.toUpperCase()}-${Math.floor(Math.random() * 1000)}`, 2)
    }
  } else if (branchCode && await Branch.isBranchCodeTaken(branchCode)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Branch code already taken');
  }
  
  branchBody.branchCode = branchCode;
  return Branch.create(branchBody);
};

/**
 * Query for branches
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryBranches = async (filter, options) => {
  const branches = await Branch.paginate(filter, options);
  return branches;
};

/**
 * Get branch by id
 * @param {ObjectId} id
 * @returns {Promise<Branch>}
 */
const getBranchById = async (id) => {
  return Branch.findById(id);
};

/**
 * Update branch by id
 * @param {ObjectId} branchId
 * @param {Object} updateBody
 * @returns {Promise<Branch>}
 */
const updateBranchById = async (branchId, updateBody) => {
  const branch = await getBranchById(branchId);
  if (!branch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Branch not found');
  }
  if (updateBody.branchCode && (await Branch.isBranchCodeTaken(updateBody.branchCode, branchId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Branch code already taken');
  }
  if (updateBody.addressId) {
    const address = await Address.findById(updateBody.addressId);
    if (!address) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Address not found');
    }
  }
  Object.assign(branch, updateBody);
  await branch.save();
  return branch;
};

/**
 * Delete branch by id
 * @param {ObjectId} branchId
 * @returns {Promise<Branch>}
 */
const deleteBranchById = async (branchId) => {
  const branch = await getBranchById(branchId);
  if (!branch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Branch not found');
  }
  await branch.remove();
  return branch;
};

// Branch.statics.isBranchCodeTaken = async function (branchCode, excludeBranchId) {
//     const branch = await this.findOne({ branchCode, _id: { $ne: excludeBranchId } });
//     return !!branch;
// };


module.exports = {
  createBranch,
  queryBranches,
  getBranchById,
  updateBranchById,
  deleteBranchById,
};
