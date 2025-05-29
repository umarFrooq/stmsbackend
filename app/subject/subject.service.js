const httpStatus = require('http-status');
const { Subject } = require('.'); // Assuming Subject model is exported from index.js in the same directory
const Branch = require('../branch/branch.model'); // Adjust path as needed
const User = require('../user/user.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');

/**
 * Create a subject
 * @param {Object} subjectBody
 * @returns {Promise<Subject>}
 */
const createSubject = async (subjectBody) => {
  if (await Subject.isSubjectCodeTaken(subjectBody.subjectCode)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Subject code already taken');
  }

  const branch = await Branch.findById(subjectBody.branchId);
  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Branch not found');
  }

  if (subjectBody.defaultTeacher) {
    const teacher = await User.findById(subjectBody.defaultTeacher);
    if (!teacher || teacher.role !== 'teacher') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Default teacher must be a valid user with the role "teacher"');
    }
  }

  return Subject.create(subjectBody);
};

/**
 * Query for subjects
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const querySubjects = async (filter, options) => {
  // Add more complex filtering logic if needed, e.g., based on roles or populated fields
  const subjects = await Subject.paginate(filter, options);
  return subjects;
};

/**
 * Get subject by id
 * @param {ObjectId} id
 * @returns {Promise<Subject>}
 */
const getSubjectById = async (id) => {
  return Subject.findById(id).populate('branchId').populate('defaultTeacher');
};

/**
 * Update subject by id
 * @param {ObjectId} subjectId
 * @param {Object} updateBody
 * @returns {Promise<Subject>}
 */
const updateSubjectById = async (subjectId, updateBody) => {
  const subject = await getSubjectById(subjectId);
  if (!subject) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subject not found');
  }

  if (updateBody.subjectCode && (await Subject.isSubjectCodeTaken(updateBody.subjectCode, subjectId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Subject code already taken');
  }

  if (updateBody.branchId) {
    const branch = await Branch.findById(updateBody.branchId);
    if (!branch) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Branch not found');
    }
  }

  if (updateBody.defaultTeacher) {
    const teacher = await User.findById(updateBody.defaultTeacher);
    if (!teacher || teacher.role !== 'teacher') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Default teacher must be a valid user with the role "teacher"');
    }
  } else if (updateBody.defaultTeacher === null) { // Handle explicitly setting teacher to null
    subject.defaultTeacher = null;
  }


  Object.assign(subject, updateBody);
  await subject.save();
  return subject;
};

/**
 * Delete subject by id
 * @param {ObjectId} subjectId
 * @returns {Promise<Subject>}
 */
const deleteSubjectById = async (subjectId) => {
  const subject = await getSubjectById(subjectId);
  if (!subject) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subject not found');
  }
  // Add any pre-delete checks here, e.g., if subject is part of any active courses
  await subject.remove();
  return subject;
};

module.exports = {
  createSubject,
  querySubjects,
  getSubjectById,
  updateSubjectById,
  deleteSubjectById,
};
