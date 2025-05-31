const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { attendanceService } = require('./attendance.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const markAttendanceHandler = catchAsync(async (req, res) => {
  const markedByUserId = req.user.id; // Assuming user ID is available in req.user
  const attendance = await attendanceService.markSingleAttendance(req.body, markedByUserId);
  res.status(httpStatus.CREATED).send(attendance);
});

const markBulkAttendanceHandler = catchAsync(async (req, res) => {
  const markedByUserId = req.user.id; // Assuming user ID is available in req.user
  const results = await attendanceService.markBulkAttendance(req.body, markedByUserId);
  
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
  const result = await attendanceService.queryAttendances(filter, options);
  res.send(result);
});

const getAttendanceHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const attendance = await attendanceService.getAttendanceById(req.params.attendanceId, populateOptions);
  if (!attendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attendance record not found');
  }
  res.send(attendance);
});

const updateAttendanceHandler = catchAsync(async (req, res) => {
  const updatedByUserId = req.user.id; // Assuming user ID is available in req.user
  const attendance = await attendanceService.updateAttendanceById(req.params.attendanceId, req.body, updatedByUserId);
  res.send(attendance);
});

const deleteAttendanceHandler = catchAsync(async (req, res) => {
  await attendanceService.deleteAttendanceById(req.params.attendanceId);
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
