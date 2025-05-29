const httpStatus = require('http-status');
const { TestResult } = require('.'); // Assuming TestResult model is exported from index.js
const Test = require('../test/test.model'); // Adjust path as needed
const User = require('../user/user.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');
const { deleteFromS3 } = require('../../config/s3.file.system'); // Assuming S3 delete utility exists

/**
 * Create a test result
 * @param {Object} resultBody - Basic result data (testId, studentId, obtainedMarks, comments)
 * @param {ObjectId} userId - ID of the user marking the result (markedBy)
 * @param {string} [imagePath] - Optional path/URL of the uploaded answer sheet image
 * @returns {Promise<TestResult>}
 */
const createTestResult = async (resultBody, userId, imagePath) => {
  const { testId, studentId, obtainedMarks } = resultBody;

  const test = await Test.findById(testId);
  if (!test) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test not found');
  }

  const student = await User.findById(studentId);
  if (!student || !['student', 'user'].includes(student.role)) { // Assuming 'user' can also be a student
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found or is not a valid student.');
  }

  if (obtainedMarks > test.totalMarks) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Obtained marks (${obtainedMarks}) cannot exceed test's total marks (${test.totalMarks}).`);
  }

  const testResultData = {
    ...resultBody,
    gradeId: test.gradeId, // Denormalize from test
    branchId: test.branchId, // Denormalize from test
    totalMarksAtTimeOfTest: test.totalMarks, // Denormalize from test
    markedBy: userId,
    answerSheetImage: imagePath, // Can be null
  };

  try {
    const testResult = await TestResult.create(testResultData);
    return testResult;
  } catch (error) {
     if (error.code === 11000 || (error.message && error.message.includes("duplicate key error")) ) {
      throw new ApiError(httpStatus.CONFLICT, 'Result for this student and test already exists.');
    }
    throw error; // Re-throw other errors
  }
};

/**
 * Query for test results
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryTestResults = async (filter, options) => {
  const { populate, ...restOptions } = options;
  
  let defaultPopulate = 'testId:title,studentId:fullname,gradeId:title,branchId:name,markedBy:fullname';
  if (populate) {
    defaultPopulate = populate;
  }
  
  let query = TestResult.find(filter);

  if (restOptions.sortBy) {
    const sortingCriteria = [];
    restOptions.sortBy.split(',').forEach((sortOption) => {
      const [key, order] = sortOption.split(':');
      sortingCriteria.push((order === 'desc' ? '-' : '') + key);
    });
    query = query.sort(sortingCriteria.join(' '));
  } else {
    query = query.sort('-createdAt'); // Default sort
  }

  defaultPopulate.split(',').forEach((populateOption) => {
    const parts = populateOption.split(':');
    let path = parts[0];
    let select = parts.length > 1 ? parts.slice(1).join(' ') : '';
    query = query.populate({ path, select });
  });

  const testResults = await TestResult.paginate(filter, restOptions, query);
  return testResults;
};

/**
 * Get test result by id
 * @param {ObjectId} resultId
 * @param {String} populateOptions - Comma separated string of fields to populate
 * @returns {Promise<TestResult>}
 */
const getTestResultById = async (resultId, populateOptions) => {
  let query = TestResult.findById(resultId);
  let defaultPopulate = 'testId studentId gradeId branchId markedBy';
   if (populateOptions) {
    defaultPopulate = populateOptions;
  }
  
  defaultPopulate.split(',').forEach((populateOption) => {
    const parts = populateOption.split(':');
    let path = parts[0];
    let select = parts.length > 1 ? parts.slice(1).join(' ') : '';
    query = query.populate({ path, select });
  });
  return query.exec();
};

/**
 * Update test result by id
 * @param {ObjectId} resultId
 * @param {Object} updateBody
 * @param {ObjectId} userId - ID of the user performing the update
 * @param {string} [newImagePath] - Optional new path/URL for the answer sheet image
 * @returns {Promise<TestResult>}
 */
const updateTestResultById = async (resultId, updateBody, userId, newImagePath) => {
  const testResult = await getTestResultById(resultId);
  if (!testResult) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test result not found');
  }

  if (updateBody.obtainedMarks !== undefined && updateBody.obtainedMarks > testResult.totalMarksAtTimeOfTest) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Obtained marks (${updateBody.obtainedMarks}) cannot exceed test's total marks (${testResult.totalMarksAtTimeOfTest}).`);
  }
  
  const oldImagePath = testResult.answerSheetImage;
  
  Object.assign(testResult, updateBody, { markedBy: userId });

  if (newImagePath !== undefined) { // If a new image is provided (even if it's null to remove existing)
    testResult.answerSheetImage = newImagePath;
    if (oldImagePath && newImagePath !== oldImagePath) { // Delete old image if different from new one
      try {
        await deleteFromS3(oldImagePath);
      } catch (s3Error) {
        console.error(`Failed to delete old image from S3: ${oldImagePath}`, s3Error);
        // Decide if this should throw an error or just log
      }
    }
  }

  await testResult.save();
  return testResult;
};

/**
 * Delete test result by id
 * @param {ObjectId} resultId
 * @returns {Promise<TestResult>}
 */
const deleteTestResultById = async (resultId) => {
  const testResult = await getTestResultById(resultId);
  if (!testResult) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test result not found');
  }

  const imagePath = testResult.answerSheetImage;
  await testResult.remove(); // Remove from DB first

  if (imagePath) {
    try {
      await deleteFromS3(imagePath);
    } catch (s3Error) {
      console.error(`Failed to delete image from S3 during result deletion: ${imagePath}`, s3Error);
      // Decide if this should throw an error or just log
      // Potentially, the result is deleted, but image remains. Might need a cleanup job.
    }
  }
  return testResult;
};

module.exports = {
  createTestResult,
  queryTestResults,
  getTestResultById,
  updateTestResultById,
  deleteTestResultById,
};
