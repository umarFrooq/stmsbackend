const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { feeService } = require('.'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createFeeHandler = catchAsync(async (req, res) => {
  // createdBy/updatedBy could be added here from req.user if needed in service
  const fee = await feeService.createFee(req.body);
  res.status(httpStatus.CREATED).send(fee);
});

const getFeesHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['studentId', 'gradeId', 'branchId', 'monthYear', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const result = await feeService.queryFees(filter, options);
  res.send(result);
});

const getFeeHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const fee = await feeService.getFeeById(req.params.feeId, populateOptions);
  if (!fee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fee record not found');
  }
  res.send(fee);
});

const updateFeeHandler = catchAsync(async (req, res) => {
  // updatedBy could be added here from req.user if needed in service
  const fee = await feeService.updateFeeById(req.params.feeId, req.body);
  res.send(fee);
});

const recordPaymentHandler = catchAsync(async (req, res) => {
  const recordedByUserId = req.user.id; // Assuming user ID is available in req.user
  const fee = await feeService.recordPayment(req.params.feeId, req.body, recordedByUserId);
  res.send(fee);
});

// Placeholder for applyFineToFee - a controller might not be needed if it's an internal service function
// or triggered by other events. If it's a direct API endpoint:
// const applyFineHandler = catchAsync(async (req, res) => {
//   const fee = await feeService.applyFineToFee(req.params.feeId, req.body.fineId);
//   res.send(fee);
// });


module.exports = {
  createFeeHandler,
  getFeesHandler,
  getFeeHandler,
  updateFeeHandler,
  recordPaymentHandler,
  // applyFineHandler, // If exposed via API
};
