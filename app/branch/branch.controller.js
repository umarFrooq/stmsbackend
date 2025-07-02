const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const  branchService  = require('./branch.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createBranchHandler = catchAsync(async (req, res) => {
  // req.schoolId is populated by schoolScopeMiddleware for scoped users (e.g. superadmin)
  // For rootUser, req.schoolId might be undefined.
  // The service layer's createBranch now expects schoolId.
  // If the creator is rootUser, schoolId must be in req.body. If superadmin, it's from req.schoolId.
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolId : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') { // Superadmin must have a schoolId from context
      throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.body.schoolId){ // Root user must specify schoolId in body
      throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in the request body for root users.');
  }

  const branch = await branchService.createBranch(req.body, schoolId);
  res.status(httpStatus.CREATED).send(branch);
});

const getBranchesHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'branchCode']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  // req.schoolId will be populated for superadmin. rootUser might not have it (global list) or specify via query.
  // The service's queryBranches now requires schoolId.
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;
   if (!schoolId && req.user.role !== 'rootUser') {
       throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
  // If schoolId is still undefined here (e.g. rootUser didn't provide in query),
  // queryBranches service will throw error if it strictly requires it.
  // Or, service could be designed to list all if schoolId is undefined AND user is root.
  // For now, queryBranches requires schoolId.
   if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId){
     // Option: allow root to list all if no schoolId, or require it.
     // Assuming for now root must specify or service handles undefined schoolId for root.
     // Let's assume the service expects it, so we'd throw error if not provided by root.
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users, or service needs adjustment for global listing.');
  }

  const result = await branchService.queryBranches(filter, options, schoolId);
  res.send(result);
});

const getBranchHandler = catchAsync(async (req, res) => {
  // req.schoolId for superadmin. rootUser might query any branch.
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;
   if (!schoolId && req.user.role !== 'rootUser') {
       throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
   if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to get a specific branch.');
  }

  const branch = await branchService.getBranchById(req.params.branchId, schoolId);
  // Service's getBranchById already throws 404 if not found in scope.
  res.send(branch);
});

const updateBranchHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
   if (!schoolId && req.user.role !== 'rootUser') {
       throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
   if (!schoolId && req.user.role === 'rootUser'){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when updating a branch.');
  }
  // rootUser needs to specify which school's branch they are updating if not in req.schoolId
  const branch = await branchService.updateBranchById(req.params.branchId, req.body, schoolId);
  res.send(branch);
});

const deleteBranchHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;
   if (!schoolId && req.user.role !== 'rootUser') {
       throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
   if (!schoolId && req.user.role === 'rootUser'){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when deleting a branch.');
  }
  await branchService.deleteBranchById(req.params.branchId, schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createBranchHandler,
  getBranchesHandler,
  getBranchHandler,
  updateBranchHandler,
  deleteBranchHandler,
};
