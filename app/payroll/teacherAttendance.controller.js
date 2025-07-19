const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { teacherAttendanceService } = require('./');

const createTeacherAttendance = catchAsync(async (req, res) => {
  const teacherAttendance = await teacherAttendanceService.createTeacherAttendance(req.body);
  res.status(httpStatus.CREATED).send(teacherAttendance);
});

const getTeacherAttendances = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['teacher', 'date', 'status', 'branch']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await teacherAttendanceService.queryTeacherAttendances(filter, options);
  res.send(result);
});

const getTeacherAttendance = catchAsync(async (req, res) => {
  const teacherAttendance = await teacherAttendanceService.getTeacherAttendanceById(req.params.teacherAttendanceId);
  if (!teacherAttendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Teacher attendance not found');
  }
  res.send(teacherAttendance);
});

const updateTeacherAttendance = catchAsync(async (req, res) => {
  const teacherAttendance = await teacherAttendanceService.updateTeacherAttendanceById(
    req.params.teacherAttendanceId,
    req.body
  );
  res.send(teacherAttendance);
});

const deleteTeacherAttendance = catchAsync(async (req, res) => {
  await teacherAttendanceService.deleteTeacherAttendanceById(req.params.teacherAttendanceId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTeacherAttendance,
  getTeacherAttendances,
  getTeacherAttendance,
  updateTeacherAttendance,
  deleteTeacherAttendance,
};
