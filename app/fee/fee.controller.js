const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { feeService } = require('.'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createFeeHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdForFee : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.body.schoolIdForFee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID (schoolIdForFee) must be provided in body for root users.');
  }
  // The service will validate studentId, gradeId, branchId in req.body against this schoolId.
  const fee = await feeService.createFee(req.body, schoolId);
  res.status(httpStatus.CREATED).send(fee);
});

const getFeesHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['studentId', 'gradeId', 'branchId', 'monthYear', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  let schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  // If a student is viewing their own fees, their req.schoolId (from JWT) will scope it.
  // If a teacher is viewing fees, their req.schoolId scopes it.
  // If req.user is student and filter.studentId is not set or not matching req.user.id, add it.
  if (req.user.role === 'student' && (!filter.studentId || filter.studentId !== req.user.id.toString())) {
      filter.studentId = req.user.id.toString(); // Force student to see only their own fees
  }

  if (!schoolId && req.user.role !== 'rootUser' && req.user.role !== 'student') { // Student's schoolId comes from their profile
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to list fees.');
  }

  const result = await feeService.queryFees(filter, options, schoolId);
  res.send(result);
});

const getFeeHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  let schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser' && req.user.role !== 'student') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users.');
  }

  const fee = await feeService.getFeeById(req.params.feeId, schoolId, populateOptions);

  // If the user is a student, ensure they are only accessing their own fee record.
  if (req.user.role === 'student' && fee.studentId.toString() !== req.user.id.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to view this fee record.');
  }
  // Service already throws 404 if not found in scope.
  res.send(fee);
});

const updateFeeHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when updating a fee.');
  }
  // updatedBy could be added from req.user.id if the service expects it
  const fee = await feeService.updateFeeById(req.params.feeId, req.body, schoolId);
  res.send(fee);
});

const recordPaymentHandler = catchAsync(async (req, res) => {
  const recordedByUserId = req.user.id;
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
   if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when recording payment.');
  }

  const fee = await feeService.recordPayment(req.params.feeId, req.body, schoolId, recordedByUserId);
  res.send(fee);
});

// applyFineHandler would follow the same pattern if implemented.


module.exports = {
  createFeeHandler,
  getFeesHandler,
  getFeeHandler,
  updateFeeHandler,
  recordPaymentHandler,
  // applyFineHandler, // If exposed via API
};
