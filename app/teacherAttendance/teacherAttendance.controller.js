const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const teacherAttendanceService = require('./teacherAttendance.service');
const pick = require('../../utils/pick');

const markTeacherAttendance = catchAsync(async (req, res) => {
  const attendance = await teacherAttendanceService.markTeacherAttendance({
    ...req.body,
    schoolId: req.school.id,
    markedBy: req.user.id,
  });
  res.status(httpStatus.CREATED).send(attendance);
});

const getTeacherAttendances = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['teacherId', 'branchId', 'date', 'status']);
  filter.schoolId = req.school.id;
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await teacherAttendanceService.queryTeacherAttendances(filter, options);
  res.send(result);
});

const getTeacherAttendance = catchAsync(async (req, res) => {
  const attendance = await teacherAttendanceService.getTeacherAttendanceById(req.params.attendanceId);
  if (!attendance || attendance.schoolId.toString() !== req.school.id) {
    res.status(httpStatus.NOT_FOUND).send();
  } else {
    res.send(attendance);
  }
});

const updateTeacherAttendance = catchAsync(async (req, res) => {
  const attendance = await teacherAttendanceService.updateTeacherAttendanceById(req.params.attendanceId, req.body);
  res.send(attendance);
});

const deleteTeacherAttendance = catchAsync(async (req, res) => {
  await teacherAttendanceService.deleteTeacherAttendanceById(req.params.attendanceId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  markTeacherAttendance,
  getTeacherAttendances,
  getTeacherAttendance,
  updateTeacherAttendance,
  deleteTeacherAttendance,
};
