const httpStatus = require('http-status');
const mongoose = require('mongoose'); // Added mongoose import
const catchAsync = require('../../utils/catchAsync');
const  gradeService  = require('./grade.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createGradeHandler = catchAsync(async (req, res) => {
  // If creator is rootUser, schoolId must be in req.body.branchId (as branch implies school).
  // Or, schoolId directly in req.body if grades can be independent of branches (current model ties grade to branch).
  // The service now expects schoolId as a direct param.
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdForGrade : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.body.schoolIdForGrade) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID (schoolIdForGrade) must be provided in the request body for root users.');
  }
  // branchId in req.body will be validated by service to belong to schoolId

  const grade = await gradeService.createGrade(req.body, schoolId);
  res.status(httpStatus.CREATED).send(grade);
});

const getGradesHandler = catchAsync(async (req, res) => {
  // Updated to pick 'search', 'branchId', and 'schoolId' (for rootUser filtering)
  const filter = pick(req.query, ['search', 'branchId', 'schoolId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  let schoolIdForService = req.user.role === 'rootUser' ? filter.schoolId : req.schoolId;

  // Validate schoolId presence for non-root users or if root user intends to list all grades without schoolId
  if (req.user.role !== 'rootUser' && !schoolIdForService) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
  // If root user is listing grades and does not provide a specific schoolId in query (filter.schoolId),
  // schoolIdForService will be undefined, allowing service to list from all schools (if service supports this).
  // If root user *does* provide filter.schoolId, that specific school's grades are listed.
  // The previous check `!schoolId && req.user.role === 'rootUser' && !req.query.schoolId` might be too restrictive
  // if we want to allow root users to list ALL grades from ALL schools by omitting schoolId.
  // The service layer will ultimately decide how to handle an undefined schoolId for a rootUser.
  // For now, we ensure that if a schoolId is expected (non-root or root filtering by school), it's present.
  if (req.user.role === 'rootUser' && filter.schoolId && !mongoose.Types.ObjectId.isValid(filter.schoolId)) {
    // This check might be better in validation, but as a safeguard:
    throw new ApiError(httpStatus.BAD_REQUEST, 'Provided schoolId is invalid.');
  }
  if (req.user.role === 'rootUser' && !filter.schoolId && req.query.schoolId){
    // This case implies req.query.schoolId was present but not picked into filter if pick was modified,
    // or if it was an empty string and got filtered out by Joi.
    // Let's ensure schoolIdForService is correctly derived.
    // The current `pick` includes 'schoolId', so if it was in req.query, it's in filter.schoolId.
    // If req.query.schoolId was an empty string, Joi's .allow('', null) handles it, making filter.schoolId undefined.
    // This is fine if root user wants to list from all schools.
  }


  // If rootUser provides a branchId, the service should ensure that branch belongs to the queried schoolId (if any).
  // For now, schoolIdForService correctly reflects the school context for the query.
  const result = await gradeService.queryGrades(filter, options, schoolIdForService, req.user.role);
  res.send(result);
});

const getGradeHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') { // Non-root users must have a schoolId from context
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
  // For rootUser, schoolId can be undefined if they want to get any grade by ID, or they can specify it.
  // The service's getGradeById now handles this with userRole.
  if (!schoolId && req.user.role === 'rootUser' && req.query.schoolId) { // If rootUser explicitly passed schoolId in query
     schoolId = req.query.schoolId;
  } else if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId) {
    // If root user and no schoolId in query, pass undefined to service for global get by ID
    schoolId = undefined;
  }


  const grade = await gradeService.getGradeById(req.params.gradeId, schoolId, req.user.role, populateOptions); // Pass userRole
  // Service already throws 404 if not found in scope (when schoolId is provided)
  res.send(grade);
});

const updateGradeHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when updating a grade.');
  }

  const grade = await gradeService.updateGradeById(req.params.gradeId, req.body, schoolId);
  res.send(grade);
});

const deleteGradeHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required for your role.');
  }
   if (!schoolId && req.user.role === 'rootUser'){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when deleting a grade.');
  }

  await gradeService.deleteGradeById(req.params.gradeId, schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

const addSectionHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId) { throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope is required.');}
  const grade = await gradeService.addSectionToGrade(req.params.gradeId, req.body.sectionName, schoolId);
  res.send(grade);
});

const removeSectionHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;
   if (!schoolId) { throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope is required.');}
  const grade = await gradeService.removeSectionFromGrade(req.params.gradeId, req.params.sectionName, schoolId);
  res.send(grade);
});

const updateSectionsHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;
  if (!schoolId) { throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope is required.');}
  const grade = await gradeService.updateSectionsInGrade(req.params.gradeId, req.body.sections, schoolId);
  res.send(grade);
});

module.exports = {
  createGradeHandler,
  getGradesHandler,
  getGradeHandler,
  updateGradeHandler,
  deleteGradeHandler,
  addSectionHandler,
  removeSectionHandler,
  updateSectionsHandler,
};
