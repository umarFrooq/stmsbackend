const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { testResultService } = require('.'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createTestResultHandler = catchAsync(async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user
  const imagePath = req.file ? req.file.key : null; // 'key' is typically the S3 object key from multer-s3

  const testResult = await testResultService.createTestResult(req.body, userId, imagePath);
  res.status(httpStatus.CREATED).send(testResult);
});

const getTestResultsHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['testId', 'studentId', 'gradeId', 'branchId', 'markedBy', 'minObtainedMarks', 'maxObtainedMarks']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const result = await testResultService.queryTestResults(filter, options);
  res.send(result);
});

const getTestResultHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const testResult = await testResultService.getTestResultById(req.params.resultId, populateOptions);
  if (!testResult) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test result not found');
  }
  res.send(testResult);
});

const updateTestResultHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const newImagePath = req.file ? req.file.key : undefined; // Allow undefined to distinguish from explicit null
                                                          // If req.file exists, new image. If undefined, image not changed.
                                                          // If body explicitly sends answerSheetImage: null, it means remove.

  // If the client wants to remove the image, they should explicitly pass answerSheetImage: null or empty string
  let finalImagePath = newImagePath; // This is the path for the new image if uploaded
  if (req.body.answerSheetImage === null || req.body.answerSheetImage === '') {
      // This means the client wants to remove the existing image without uploading a new one
      finalImagePath = null;
  }


  const testResult = await testResultService.updateTestResultById(
    req.params.resultId,
    req.body,
    userId,
    finalImagePath // Pass the path of the new image, or null to remove, or undefined if not changing
  );
  res.send(testResult);
});

const deleteTestResultHandler = catchAsync(async (req, res) => {
  await testResultService.deleteTestResultById(req.params.resultId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTestResultHandler,
  getTestResultsHandler,
  getTestResultHandler,
  updateTestResultHandler,
  deleteTestResultHandler,
};
