const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const  subjectService  = require('./subject.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose'); // For ObjectId.isValid

const createSubjectHandler = catchAsync(async (req, res) => {
  // req.schoolId is populated by schoolScopeMiddleware for scoped users (e.g., admin)
  // For rootUser, schoolId must be in req.body if they are creating a subject for a specific school.
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolId : req.schoolId;
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to create a subject.');
  }
  const subject = await subjectService.createSubject(req.body, schoolId);
  res.status(httpStatus.CREATED).send(subject);
});

const getSubjectsHandler = catchAsync(async (req, res) => {
  // Controller now picks 'search' and new filters, and 'schoolId' for rootUser
  const filter = pick(req.query, ['search', 'branchId', 'schoolId']); // Added 'schoolId' for root to filter
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']); // Added populate

  let schoolIdForService;
  if (req.user.role === 'rootUser') {
    schoolIdForService = filter.schoolId; // Root user can specify a school or omit for all (if service supports)
    // The service `querySubjects` currently requires schoolId. This means root user MUST provide it.
    if (!schoolIdForService && req.query.schoolId) schoolIdForService = req.query.schoolId; // If it was an empty string and got filtered by pick
    if (!schoolIdForService) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Root users must specify a schoolId to list subjects.');
    }
    if (!mongoose.Types.ObjectId.isValid(schoolIdForService)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid schoolId provided by root user.');
    }
  } else {
    schoolIdForService = req.schoolId; // Scoped user (e.g. admin) uses their own schoolId from middleware
    if (!schoolIdForService) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
    }
  }
  delete filter.schoolId; // Remove from filter object as it's passed as a direct param to service

  const result = await subjectService.querySubjects(filter, options, schoolIdForService);
  res.send(result);
});

const getSubjectHandler = catchAsync(async (req, res) => {
  let schoolIdForService;
  if (req.user.role === 'rootUser') {
    schoolIdForService = req.query.schoolId; // Root user can specify schoolId for context
    if (schoolIdForService && !mongoose.Types.ObjectId.isValid(schoolIdForService)) {
         throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid schoolId provided by root user.');
    }
    // If root user doesn't provide schoolId, service might fetch from any school or require it.
    // subjectService.getSubjectById currently REQUIRES schoolId.
    if (!schoolIdForService) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Root users must specify a schoolId to get a subject.');
    }
  } else {
    schoolIdForService = req.schoolId;
    if (!schoolIdForService) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
    }
  }
  const populateOptions = req.query.populate; // Assuming getSubjectById will support populate
  const subject = await subjectService.getSubjectById(req.params.subjectId, schoolIdForService, populateOptions);
  // Service already throws 404 if not found
  res.send(subject);
});

const updateSubjectHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? (req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo) : req.schoolId;
  if (!schoolId) {
    const message = req.user.role === 'rootUser'
        ? 'School ID (schoolIdToScopeTo in body/query) must be provided for root user to update a subject.'
        : 'School context is required for your role.';
    throw new ApiError(httpStatus.BAD_REQUEST, message);
  }
  const subject = await subjectService.updateSubjectById(req.params.subjectId, req.body, schoolId);
  res.send(subject);
});

const deleteSubjectHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;
   if (!schoolId) {
    const message = req.user.role === 'rootUser'
        ? 'School ID (schoolIdToScopeTo in query) must be provided for root user to delete a subject.'
        : 'School context is required for your role.';
    throw new ApiError(httpStatus.BAD_REQUEST, message);
  }
  await subjectService.deleteSubjectById(req.params.subjectId, schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createSubjectHandler,
  getSubjectsHandler,
  getSubjectHandler,
  updateSubjectHandler,
  deleteSubjectHandler,
};
