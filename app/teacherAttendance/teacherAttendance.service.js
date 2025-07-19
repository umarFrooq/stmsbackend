const httpStatus = require('http-status');
const TeacherAttendance = require('./teacherAttendance.model');
const ApiError = require('../../utils/ApiError');
const { userService } = require('../user');

/**
 * Mark teacher attendance
 * @param {Object} attendanceBody
 * @returns {Promise<TeacherAttendance>}
 */
const markTeacherAttendance = async (attendanceBody) => {
  const { teacherId, date } = attendanceBody;
  if (await TeacherAttendance.findOne({ teacherId, date })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Attendance for this teacher on this date already exists.');
  }
  return TeacherAttendance.create(attendanceBody);
};

/**
 * Query for teacher attendance
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryTeacherAttendances = async (filter, options) => {
  const attendances = await TeacherAttendance.paginate(filter, options);
  return attendances;
};

/**
 * Get teacher attendance by id
 * @param {ObjectId} id
 * @returns {Promise<TeacherAttendance>}
 */
const getTeacherAttendanceById = async (id) => {
  return TeacherAttendance.findById(id);
};

/**
 * Update teacher attendance by id
 * @param {ObjectId} attendanceId
 * @param {Object} updateBody
 * @returns {Promise<TeacherAttendance>}
 */
const updateTeacherAttendanceById = async (attendanceId, updateBody) => {
  const attendance = await getTeacherAttendanceById(attendanceId);
  if (!attendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attendance not found');
  }
  Object.assign(attendance, updateBody);
  await attendance.save();
  return attendance;
};

/**
 * Delete teacher attendance by id
 * @param {ObjectId} attendanceId
 * @returns {Promise<TeacherAttendance>}
 */
const deleteTeacherAttendanceById = async (attendanceId) => {
  const attendance = await getTeacherAttendanceById(attendanceId);
  if (!attendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attendance not found');
  }
  await attendance.remove();
  return attendance;
};

module.exports = {
  markTeacherAttendance,
  queryTeacherAttendances,
  getTeacherAttendanceById,
  updateTeacherAttendanceById,
  deleteTeacherAttendanceById,
};
