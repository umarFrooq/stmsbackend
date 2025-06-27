const httpStatus = require('http-status');
const { Test } = require('.'); // Assuming Test model is exported from index.js
const Subject = require('../subject/subject.model'); // Adjust path as needed
const Grade = require('../grade/grade.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');

/**
 * Helper to validate related entities for a test
 */
const validateTestEntities = async (testBody) => {
  const { subjectId, gradeId, branchId, section } = testBody;

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Subject with ID ${subjectId} not found.`);
  }

  const grade = await Grade.findById(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Grade with ID ${gradeId} not found.`);
  }

  const branch = await Branch.findById(branchId);
  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found.`);
  }

  // Validate section if provided
  if (section && !grade.sections.map(s=>s.toUpperCase()).includes(section.toUpperCase())) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Section ${section} not found in Grade ${grade.title}.`);
  }

  // Ensure all entities belong to the same branch (if applicable)
  if (subject.branchId.toString() != branchId) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Subject ${subject.title} does not belong to branch ${branch.name}.`);
  }
  if (grade.branchId._id.toString() != branchId) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Grade ${grade.title} does not belong to branch ${branch.name}.`);
  }
};

/**
 * Create a test
 * @param {Object} testBody
 * @param {ObjectId} userId - ID of the user creating the test
 * @returns {Promise<Test>}
 */
const createTest = async (testBody, userId) => {
  await validateTestEntities(testBody);
  
  if (testBody.passingMarks !== undefined && testBody.totalMarks !== undefined && testBody.passingMarks > testBody.totalMarks) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Passing marks cannot be greater than total marks.');
  }

  const test = await Test.create({ ...testBody, createdBy: userId });
  return test;
};

/**
 * Query for tests
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryTests = async (filter, options) => {
  const { populate, ...restOptions } = options;

  // Handle date range queries
  if (filter.startDate && filter.endDate) {
    filter.date = { $gte: new Date(filter.startDate), $lte: new Date(filter.endDate) };
    delete filter.startDate;
    delete filter.endDate;
  } else if (filter.startDate) {
    filter.date = { $gte: new Date(filter.startDate) };
    delete filter.startDate;
  } else if (filter.endDate) {
    filter.date = { $lte: new Date(filter.endDate) };
    delete filter.endDate;
  }
  
  let defaultPopulate = 'subjectId:title,gradeId:title,branchId:name,createdBy:fullname';
  if (populate) {
    defaultPopulate = populate; // Override with user-provided populate if exists
  }

  let query = Test.find(filter);
   if (restOptions.sortBy) {
    const sortingCriteria = [];
    restOptions.sortBy.split(',').forEach((sortOption) => {
      const [key, order] = sortOption.split(':');
      sortingCriteria.push((order === 'desc' ? '-' : '') + key);
    });
    query = query.sort(sortingCriteria.join(' '));
  } else {
    query = query.sort('-date -createdAt'); // Default sort
  }

  // Apply population
  defaultPopulate.split(',').forEach((populateOption) => {
    const parts = populateOption.split(':');
    let path = parts[0];
    let select = parts.length > 1 ? parts.slice(1).join(' ') : '';
    query = query.populate({ path, select });
  });
  
  const tests = await Test.paginate(filter, restOptions, query);
  return tests;
};

/**
 * Get test by id
 * @param {ObjectId} id
 * @param {String} populateOptions - Comma separated string of fields to populate
 * @returns {Promise<Test>}
 */
const getTestById = async (id, populateOptions) => {
  let query = Test.findById(id);
  let defaultPopulate = 'subjectId gradeId branchId createdBy';
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
 * Update test by id
 * @param {ObjectId} testId
 * @param {Object} updateBody
 * @returns {Promise<Test>}
 */
const updateTestById = async (testId, updateBody) => {
  const test = await getTestById(testId);
  if (!test) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test not found');
  }

  // If related entities are being updated, validate them
  if (updateBody.subjectId || updateBody.gradeId || updateBody.branchId || updateBody.section) {
    const tempTestBodyForValidation = {
        subjectId: updateBody.subjectId || test.subjectId,
        gradeId: updateBody.gradeId || test.gradeId,
        branchId: updateBody.branchId || test.branchId,
        section: updateBody.section !== undefined ? updateBody.section : test.section, // Handle explicit null/empty for section
    };
    await validateTestEntities(tempTestBodyForValidation);
  }
  
  const totalMarks = updateBody.totalMarks !== undefined ? updateBody.totalMarks : test.totalMarks;
  const passingMarks = updateBody.passingMarks !== undefined ? updateBody.passingMarks : test.passingMarks;

  if (passingMarks !== undefined && totalMarks !== undefined && passingMarks > totalMarks) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Passing marks cannot be greater than total marks.');
  }


  Object.assign(test, updateBody);
  await test.save();
  return test;
};

/**
 * Delete test by id
 * @param {ObjectId} testId
 * @returns {Promise<Test>}
 */
const deleteTestById = async (testId) => {
  const test = await getTestById(testId);
  if (!test) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test not found');
  }
  // Add any pre-delete checks, e.g., if results are associated with this test
  await test.remove();
  return test;
};

module.exports = {
  createTest,
  queryTests,
  getTestById,
  updateTestById,
  deleteTestById,
};
