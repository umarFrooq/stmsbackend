const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { testService } = require('.'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createTestHandler = catchAsync(async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user
  const test = await testService.createTest(req.body, userId);
  res.status(httpStatus.CREATED).send(test);
});

const getTestsHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'subjectId', 'gradeId', 'section', 'branchId', 'date', 'startDate', 'endDate', 'createdBy']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const result = await testService.queryTests(filter, options);
  res.send(result);
});

const getTestHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const test = await testService.getTestById(req.params.testId, populateOptions);
  if (!test) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test not found');
  }
  res.send(test);
});

const updateTestHandler = catchAsync(async (req, res) => {
  const test = await testService.updateTestById(req.params.testId, req.body);
  res.send(test);
});

const deleteTestHandler = catchAsync(async (req, res) => {
  await testService.deleteTestById(req.params.testId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTestHandler,
  getTestsHandler,
  getTestHandler,
  updateTestHandler,
  deleteTestHandler,
};
