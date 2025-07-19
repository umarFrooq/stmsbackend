const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const leavePolicyService = require('./leavePolicy.service');
const pick = require('../../utils/pick');

const createLeavePolicy = catchAsync(async (req, res) => {
  const leavePolicy = await leavePolicyService.createLeavePolicy({
    ...req.body,
    schoolId: req.school.id,
    branchId: req.body.branchId,
    createdBy: req.user.id,
  });
  res.status(httpStatus.CREATED).send(leavePolicy);
});

const getLeavePolicy = catchAsync(async (req, res) => {
  const leavePolicy = await leavePolicyService.getLeavePolicyByBranch({
    schoolId: req.school.id,
    branchId: req.params.branchId,
  });
  if (!leavePolicy) {
    res.status(httpStatus.NOT_FOUND).send();
  } else {
    res.send(leavePolicy);
  }
});

const updateLeavePolicy = catchAsync(async (req, res) => {
  const leavePolicy = await leavePolicyService.updateLeavePolicy(
    {
      schoolId: req.school.id,
      branchId: req.params.branchId,
    },
    req.body
  );
  res.send(leavePolicy);
});

module.exports = {
  createLeavePolicy,
  getLeavePolicy,
  updateLeavePolicy,
};
