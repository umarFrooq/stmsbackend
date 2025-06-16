const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { fineService } = require('.'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const issueFineHandler = catchAsync(async (req, res) => {
  const issuedByUserId = req.user.id; // Assuming user ID is available in req.user
  const fine = await fineService.issueFine(req.body, issuedByUserId);
  res.status(httpStatus.CREATED).send(fine);
});

const getFinesHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['studentId', 'branchId', 'type', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const result = await fineService.queryFines(filter, options);
  res.send(result);
});

const getFineHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const fine = await fineService.getFineById(req.params.fineId, populateOptions);
  if (!fine) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fine record not found');
  }
  res.send(fine);
});

const updateFineStatusHandler = catchAsync(async (req, res) => {
  const updatedByUserId = req.user.id; // User performing the action
  const fine = await fineService.updateFineStatus(req.params.fineId, req.body, updatedByUserId);
  res.send(fine);
});

module.exports = {
  issueFineHandler,
  getFinesHandler,
  getFineHandler,
  updateFineStatusHandler,
};
