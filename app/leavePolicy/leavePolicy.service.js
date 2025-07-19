const httpStatus = require('http-status');
const LeavePolicy = require('./leavePolicy.model');
const ApiError = require('../../utils/ApiError');

/**
 * Create a leave policy
 * @param {Object} leavePolicyBody
 * @returns {Promise<LeavePolicy>}
 */
const createLeavePolicy = async (leavePolicyBody) => {
  if (await LeavePolicy.findOne({ schoolId: leavePolicyBody.schoolId, branchId: leavePolicyBody.branchId })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Leave policy for this branch already exists.');
  }
  return LeavePolicy.create(leavePolicyBody);
};

/**
 * Get leave policy by branch
 * @param {Object} params
 * @returns {Promise<LeavePolicy>}
 */
const getLeavePolicyByBranch = async (params) => {
  return LeavePolicy.findOne({ schoolId: params.schoolId, branchId: params.branchId });
};

/**
 * Update leave policy
 * @param {Object} params
 * @param {Object} updateBody
 * @returns {Promise<LeavePolicy>}
 */
const updateLeavePolicy = async (params, updateBody) => {
  const leavePolicy = await getLeavePolicyByBranch(params);
  if (!leavePolicy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leave policy not found');
  }
  Object.assign(leavePolicy, updateBody);
  await leavePolicy.save();
  return leavePolicy;
};

module.exports = {
  createLeavePolicy,
  getLeavePolicyByBranch,
  updateLeavePolicy,
};
