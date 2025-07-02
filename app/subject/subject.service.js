const httpStatus = require('http-status');
const { Subject } = require('.'); // Assuming Subject model is exported from index.js in the same directory
const Branch = require('../branch/branch.model'); // Adjust path as needed
const User = require('../user/user.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');
let {slugGenerator}=require("@/config/components/general.methods");
/**
 * Create a subject
 * @param {Object} subjectData - Data for the subject
 * @param {ObjectId} schoolId - The ID of the school this subject belongs to
 * @returns {Promise<Subject>}
 */
const createSubject = async (subjectData, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to create a subject.');
  }

  // Generate subjectCode if not provided, or validate existing one
  if (!subjectData.subjectCode) {
    subjectData.subjectCode = slugGenerator(subjectData.title || 'SUB', 3); // Generate based on title or default
  }

  if (await Subject.isSubjectCodeTakenInSchool(subjectData.subjectCode, schoolId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Subject code already taken for this school.');
  }

  const branch = await Branch.findOne({ _id: subjectData.branchId, schoolId });
  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Branch not found or does not belong to this school.');
  }

  if (subjectData.defaultTeacher) {
    const teacher = await User.findOne({ _id: subjectData.defaultTeacher, schoolId, role: 'teacher' });
    if (!teacher) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Default teacher must be a valid user with the role "teacher" in this school.');
    }
  }

  const subjectPayload = { ...subjectData, schoolId };
  return Subject.create(subjectPayload);
};

/**
 * Query for subjects
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {ObjectId} schoolId - The ID of the school
 * @returns {Promise<QueryResult>}
 */
const querySubjects = async (filter, options, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to query subjects.');
  }
  const schoolScopedFilter = { ...filter, schoolId };
  const subjects = await Subject.paginate(schoolScopedFilter, options);
  return subjects;
};

/**
 * Get subject by id and schoolId
 * @param {ObjectId} id - Subject ID
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Subject>}
 */
const getSubjectById = async (id, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to get a subject.');
  }
  const subject = await Subject.findOne({ _id: id, schoolId })
    .populate('branchId', 'name branchCode') // Populate specific fields
    .populate('defaultTeacher', 'fullname email'); // Populate specific fields

  if (!subject) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subject not found or not associated with this school.');
  }
  return subject;
};

/**
 * Update subject by id
 * @param {ObjectId} subjectId - Subject ID
 * @param {Object} updateBody - Data to update
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Subject>}
 */
const updateSubjectById = async (subjectId, updateBody, schoolId) => {
  const subject = await getSubjectById(subjectId, schoolId); // Ensures subject belongs to school

  if (updateBody.schoolId && updateBody.schoolId.toString() !== schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of a subject.');
  }
  delete updateBody.schoolId;

  if (updateBody.subjectCode && (await Subject.isSubjectCodeTakenInSchool(updateBody.subjectCode, schoolId, subjectId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Subject code already taken for this school.');
  }

  if (updateBody.branchId && updateBody.branchId.toString() !== subject.branchId._id.toString()) {
    const newBranch = await Branch.findOne({ _id: updateBody.branchId, schoolId });
    if (!newBranch) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'New branch not found or does not belong to this school.');
    }
  }

  if (updateBody.defaultTeacher) {
    const teacher = await User.findOne({ _id: updateBody.defaultTeacher, schoolId, role: 'teacher' });
    if (!teacher) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'New default teacher must be a valid user with the role "teacher" in this school.');
    }
  } else if (updateBody.hasOwnProperty('defaultTeacher') && updateBody.defaultTeacher === null) {
    // Allow unsetting the teacher
    updateBody.defaultTeacher = null;
  }


  Object.assign(subject, updateBody);
  await subject.save();
  return subject.populate('branchId', 'name branchCode').populate('defaultTeacher', 'fullname email').execPopulate();
};

/**
 * Delete subject by id
 * @param {ObjectId} subjectId - Subject ID
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Subject>}
 */
const deleteSubjectById = async (subjectId, schoolId) => {
  const subject = await getSubjectById(subjectId, schoolId); // Ensures subject belongs to school
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
