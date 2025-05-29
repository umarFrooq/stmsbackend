const httpStatus = require('http-status');
const { Grade } = require('.'); // Assuming Grade model is exported from index.js
const Branch = require('../branch/branch.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');
const { roleTypes } = require('../../config/enums'); // Assuming roles are defined here

/**
 * Create a grade
 * @param {Object} gradeBody
 * @returns {Promise<Grade>}
 */
const createGrade = async (gradeBody) => {
  const branch = await Branch.findById(gradeBody.branchId);
  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Branch not found');
  }

  if (gradeBody.levelCode && await Grade.isLevelCodeTakenInBranch(gradeBody.levelCode, gradeBody.branchId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Level code already taken for this branch');
  }

  if (gradeBody.nextGradeId) {
    const nextGrade = await Grade.findById(gradeBody.nextGradeId);
    if (!nextGrade) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'NextGradeId not found');
    }
  }

  return Grade.create(gradeBody);
};

/**
 * Query for grades
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryGrades = async (filter, options) => {
  const { populate, ...restOptions } = options;
  let query = Grade.find(filter).sort(restOptions.sortBy);

  if (populate) {
      populate.split(',').forEach((populateOption) => {
        const parts = populateOption.split(':');
        if (parts.length > 1) {
            query = query.populate({ path: parts[0], select: parts.slice(1).join(' ') });
        } else {
            query = query.populate(parts[0]);
        }
    });
  }
  
  const grades = await Grade.paginate(filter, restOptions, query);
  return grades;
};


/**
 * Get grade by id
 * @param {ObjectId} id
 * @param {String} populateOptions - Comma separated string of fields to populate
 * @returns {Promise<Grade>}
 */
const getGradeById = async (id, populateOptions) => {
  let query = Grade.findById(id);
  if (populateOptions) {
    populateOptions.split(',').forEach((populateOption) => {
        const parts = populateOption.split(':');
        if (parts.length > 1) {
            query = query.populate({ path: parts[0], select: parts.slice(1).join(' ') });
        } else {
            query = query.populate(parts[0]);
        }
    });
  }
  return query.exec();
};

/**
 * Update grade by id
 * @param {ObjectId} gradeId
 * @param {Object} updateBody
 * @returns {Promise<Grade>}
 */
const updateGradeById = async (gradeId, updateBody) => {
  const grade = await getGradeById(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Grade not found');
  }

  if (updateBody.branchId) {
    const branch = await Branch.findById(updateBody.branchId);
    if (!branch) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Branch not found');
    }
  }
  
  if (updateBody.levelCode && (await Grade.isLevelCodeTakenInBranch(updateBody.levelCode, updateBody.branchId || grade.branchId.toString() , gradeId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Level code already taken for this branch');
  }

  if (updateBody.nextGradeId) {
    const nextGrade = await Grade.findById(updateBody.nextGradeId);
    if (!nextGrade) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'NextGradeId not found');
    }
  }

  Object.assign(grade, updateBody);
  await grade.save();
  return grade;
};

/**
 * Delete grade by id
 * @param {ObjectId} gradeId
 * @returns {Promise<Grade>}
 */
const deleteGradeById = async (gradeId) => {
  const grade = await getGradeById(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Grade not found');
  }
  // Add any pre-delete checks, e.g., if students are enrolled in this grade
  await grade.remove();
  return grade;
};

/**
 * Add a section to a grade
 * @param {ObjectId} gradeId
 * @param {string} sectionName
 * @returns {Promise<Grade>}
 */
const addSectionToGrade = async (gradeId, sectionName) => {
  const grade = await getGradeById(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Grade not found');
  }
  const upperSectionName = sectionName.toUpperCase();
  if (grade.sections.includes(upperSectionName)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Section already exists in this grade');
  }
  grade.sections.push(upperSectionName);
  await grade.save();
  return grade;
};

/**
 * Remove a section from a grade
 * @param {ObjectId} gradeId
 * @param {string} sectionName
 * @returns {Promise<Grade>}
 */
const removeSectionFromGrade = async (gradeId, sectionName) => {
  const grade = await getGradeById(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Grade not found');
  }
  const upperSectionName = sectionName.toUpperCase();
  if (!grade.sections.includes(upperSectionName)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Section not found in this grade');
  }
  grade.sections = grade.sections.filter((s) => s !== upperSectionName);
  await grade.save();
  return grade;
};

/**
 * Update/Replace all sections in a grade
 * @param {ObjectId} gradeId
 * @param {string[]} sectionsArray - Array of new section names
 * @returns {Promise<Grade>}
 */
const updateSectionsInGrade = async (gradeId, sectionsArray) => {
  const grade = await getGradeById(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Grade not found');
  }
  // Ensure uniqueness and uppercase for the incoming array
  const uniqueSections = [...new Set(sectionsArray.map(s => s.toUpperCase().trim()))];
  grade.sections = uniqueSections;
  await grade.save();
  return grade;
};


module.exports = {
  createGrade,
  queryGrades,
  getGradeById,
  updateGradeById,
  deleteGradeById,
  addSectionToGrade,
  removeSectionFromGrade,
  updateSectionsInGrade,
};
