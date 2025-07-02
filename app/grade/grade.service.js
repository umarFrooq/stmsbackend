const httpStatus = require('http-status');
const  Grade  = require('./grade.model'); // Assuming Grade model is exported from index.js
const Branch = require('../branch/branch.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');

/**
 * Create a grade
 * @param {Object} gradeData - Data for the grade
 * @param {ObjectId} schoolId - The ID of the school this grade belongs to
 * @returns {Promise<Grade>}
 */
const createGrade = async (gradeData, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to create a grade.');
  }
  // Verify branchId belongs to the school
  const branch = await Branch.findOne({ _id: gradeData.branchId, schoolId });
  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Branch not found or does not belong to this school.');
  }

  if (gradeData.levelCode && await Grade.isLevelCodeTakenInSchool(gradeData.levelCode, schoolId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Level code already taken for this school.');
  }

  if (gradeData.nextGradeId) {
    const nextGrade = await Grade.findOne({ _id: gradeData.nextGradeId, schoolId });
    if (!nextGrade) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'NextGradeId not found or does not belong to this school.');
    }
  }

  const gradePayload = { ...gradeData, schoolId };
  return Grade.create(gradePayload);
};

/**
 * Query for grades
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {ObjectId} schoolId - The ID of the school
 * @returns {Promise<QueryResult>}
 */
const queryGrades = async (filter, options, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to query grades.');
  }
  const schoolScopedFilter = { ...filter, schoolId };
  
  // The existing populate logic seems complex and might not be directly compatible with Model.paginate(filter, options)
  // Model.paginate usually handles population via options.populate.
  // Let's simplify assuming options.populate is used as standard by paginate plugin.
  // If custom query building is needed before paginate, it's more involved.
  // For now, assuming standard usage of paginate:
  const grades = await Grade.paginate(schoolScopedFilter, options);
  return grades;
};


/**
 * Get grade by id and schoolId
 * @param {ObjectId} id - Grade ID
 * @param {ObjectId} schoolId - School ID
 * @param {String} populateOptions - Comma separated string of fields to populate (passed to options for paginate or direct query)
 * @returns {Promise<Grade>}
 */
const getGradeById = async (id, schoolId, populateOptionsStr) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to get a grade.');
  }
  let query = Grade.findOne({ _id: id, schoolId });
  if (populateOptionsStr) {
    // Simple population, assuming populate plugin handles complex paths if needed
    populateOptionsStr.split(',').forEach(populateOption => {
      query = query.populate(populateOption.trim());
    });
  }
  const grade = await query.exec();
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Grade not found or not associated with this school.');
  }
  return grade;
};

/**
 * Update grade by id
 * @param {ObjectId} gradeId - Grade ID
 * @param {Object} updateBody - Data to update
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Grade>}
 */
const updateGradeById = async (gradeId, updateBody, schoolId) => {
  const grade = await getGradeById(gradeId, schoolId); // Ensures grade belongs to school

  if (updateBody.schoolId && updateBody.schoolId.toString() !== schoolId.toString()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of a grade.');
  }
  delete updateBody.schoolId;

  if (updateBody.branchId && updateBody.branchId.toString() !== grade.branchId.toString()) {
    // If branch is being changed, verify the new branch belongs to the same school
    const newBranch = await Branch.findOne({ _id: updateBody.branchId, schoolId });
    if (!newBranch) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'New branch not found or does not belong to this school.');
    }
  }
  
  if (updateBody.levelCode && (await Grade.isLevelCodeTakenInSchool(updateBody.levelCode, schoolId, gradeId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Level code already taken for this school.');
  }

  if (updateBody.nextGradeId) {
    const nextGrade = await Grade.findOne({ _id: updateBody.nextGradeId, schoolId });
    if (!nextGrade) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'NextGradeId not found or does not belong to this school.');
    }
  }

  Object.assign(grade, updateBody);
  await grade.save();
  return grade;
};

/**
 * Delete grade by id
 * @param {ObjectId} gradeId - Grade ID
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Grade>}
 */
const deleteGradeById = async (gradeId, schoolId) => {
  const grade = await getGradeById(gradeId, schoolId); // Ensures grade belongs to school
  // Add any pre-delete checks, e.g., if students are enrolled in this grade
  await grade.remove();
  return grade;
};

/**
 * Add a section to a grade
 * @param {ObjectId} gradeId - Grade ID
 * @param {string} sectionName - Name of the section
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Grade>}
 */
const addSectionToGrade = async (gradeId, sectionName, schoolId) => {
  const grade = await getGradeById(gradeId, schoolId); // Ensures grade belongs to school
  const upperSectionName = sectionName.toUpperCase().trim();
  if (grade.sections.includes(upperSectionName)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Section already exists in this grade.');
  }
  grade.sections.push(upperSectionName);
  await grade.save();
  return grade;
};

/**
 * Remove a section from a grade
 * @param {ObjectId} gradeId - Grade ID
 * @param {string} sectionName - Name of the section
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Grade>}
 */
const removeSectionFromGrade = async (gradeId, sectionName, schoolId) => {
  const grade = await getGradeById(gradeId, schoolId); // Ensures grade belongs to school
  const upperSectionName = sectionName.toUpperCase().trim();
  if (!grade.sections.includes(upperSectionName)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Section not found in this grade.');
  }
  grade.sections = grade.sections.filter((s) => s !== upperSectionName);
  await grade.save();
  return grade;
};

/**
 * Update/Replace all sections in a grade
 * @param {ObjectId} gradeId - Grade ID
 * @param {string[]} sectionsArray - Array of new section names
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Grade>}
 */
const updateSectionsInGrade = async (gradeId, sectionsArray, schoolId) => {
  const grade = await getGradeById(gradeId, schoolId); // Ensures grade belongs to school
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
