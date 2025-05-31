const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { branchService } = require('./branch.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createBranchHandler = catchAsync(async (req, res) => {
  const branch = await branchService.createBranch(req.body);
  res.status(httpStatus.CREATED).send(branch);
});

const getBranchesHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'branchCode']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await branchService.queryBranches(filter, options);
  res.send(result);
});

const getBranchHandler = catchAsync(async (req, res) => {
  const branch = await branchService.getBranchById(req.params.branchId);
  if (!branch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Branch not found');
  }
  res.send(branch);
});

const updateBranchHandler = catchAsync(async (req, res) => {
  const branch = await branchService.updateBranchById(req.params.branchId, req.body);
  res.send(branch);
});

const deleteBranchHandler = catchAsync(async (req, res) => {
  await branchService.deleteBranchById(req.params.branchId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createBranchHandler,
  getBranchesHandler,
  getBranchHandler,
  updateBranchHandler,
  deleteBranchHandler,
};
