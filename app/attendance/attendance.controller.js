const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const  attendanceService  = require('./attendance.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const markAttendanceHandler = catchAsync(async (req, res) => {
  const markedByUserId = req.user.id;
  const schoolId = req.schoolId; // From schoolScopeMiddleware
  if (!schoolId && req.user.role !== 'rootUser') { // rootUser might need to specify schoolId in body if they can mark attendance
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  // If rootUser, schoolId for marking attendance should come from req.body or be inferred (e.g. via studentId's school)
  // For now, service expects schoolId explicitly if a non-root user is calling.
  // The service will validate entities against this schoolId.
  const finalSchoolId = req.user.role === 'rootUser' ? req.body.schoolIdForAttendance : schoolId;
   if (!finalSchoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be specified for this operation.');
  }

  const attendance = await attendanceService.markSingleAttendance(req.body, finalSchoolId, markedByUserId);
  res.status(httpStatus.CREATED).send(attendance);
});

const markBulkAttendanceHandler = catchAsync(async (req, res) => {
  const markedByUserId = req.user.id;
  const schoolId = req.schoolId;
  const finalSchoolId = req.user.role === 'rootUser' ? req.body.schoolIdForAttendance : schoolId;
   if (!finalSchoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be specified for this operation.');
  }

  const results = await attendanceService.markBulkAttendance(req.body, finalSchoolId, markedByUserId);
  
  // Determine overall status based on results
  if (results.errors.length > 0 && results.success.length === 0) {
    // If all entries failed
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'All attendance records failed to process.',
      errors: results.errors,
      success: results.success,
    });
  } else if (results.errors.length > 0) {
    // If some entries failed (partial success)
    return res.status(httpStatus.PARTIAL_CONTENT).send({ // 206 Partial Content or 207 Multi-Status
      message: 'Some attendance records were processed successfully, while others failed.',
      errors: results.errors,
      success: results.success,
    });
  }
  // All entries processed successfully
  res.status(httpStatus.CREATED).send({
      message: 'All attendance records processed successfully.',
      success: results.success,
      errors: results.errors, // Should be empty here
  });
});

const getAttendancesHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['studentId', 'subjectId', 'gradeId', 'section', 'branchId', 'date', 'status', 'markedBy', 'startDate', 'endDate']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to list attendance.');
  }

  const result = await attendanceService.queryAttendances(filter, options, schoolId);
  res.send(result);
});

const getAttendanceHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolId : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
   if (!schoolId && req.user.role === 'rootUser' && !req.query.schoolId){
     throw new ApiError(httpStatus.BAD_REQUEST, 'School ID must be provided in query for root users to get specific attendance.');
  }

  const attendance = await attendanceService.getAttendanceById(req.params.attendanceId, schoolId, populateOptions);
  // Service handles 404 if not found in scope
  res.send(attendance);
});

const updateAttendanceHandler = catchAsync(async (req, res) => {
  const updatedByUserId = req.user.id;
  const schoolId = req.user.role === 'rootUser' ? req.body.schoolIdToScopeTo || req.query.schoolIdToScopeTo : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when updating attendance.');
  }

  const attendance = await attendanceService.updateAttendanceById(req.params.attendanceId, req.body, schoolId, updatedByUserId);
  res.send(attendance);
});

const deleteAttendanceHandler = catchAsync(async (req, res) => {
  const schoolId = req.user.role === 'rootUser' ? req.query.schoolIdToScopeTo : req.schoolId;

  if (!schoolId && req.user.role !== 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School context is required.');
  }
  if (!schoolId && req.user.role === 'rootUser') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID scope must be provided for root users when deleting attendance.');
  }

  await attendanceService.deleteAttendanceById(req.params.attendanceId, schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  markAttendanceHandler,
  markBulkAttendanceHandler,
  getAttendancesHandler,
  getAttendanceHandler,
  updateAttendanceHandler,
  deleteAttendanceHandler,
};
