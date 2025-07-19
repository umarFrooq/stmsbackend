const { TeacherAttendance } = require('./teacherAttendance.model');

/**
 * Create a teacher attendance
 * @param {Object} teacherAttendanceBody
 * @returns {Promise<TeacherAttendance>}
 */
const createTeacherAttendance = async (teacherAttendanceBody) => {
  const teacherAttendance = await TeacherAttendance.create(teacherAttendanceBody);
  return teacherAttendance;
};

/**
 * Query for teacher attendances
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryTeacherAttendances = async (filter, options) => {
  const teacherAttendances = await TeacherAttendance.paginate(filter, options);
  return teacherAttendances;
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
 * @param {ObjectId} teacherAttendanceId
 * @param {Object} updateBody
 * @returns {Promise<TeacherAttendance>}
 */
const updateTeacherAttendanceById = async (teacherAttendanceId, updateBody) => {
  const teacherAttendance = await getTeacherAttendanceById(teacherAttendanceId);
  if (!teacherAttendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Teacher attendance not found');
  }
  Object.assign(teacherAttendance, updateBody);
  await teacherAttendance.save();
  return teacherAttendance;
};

/**
 * Delete teacher attendance by id
 * @param {ObjectId} teacherAttendanceId
 * @returns {Promise<TeacherAttendance>}
 */
const deleteTeacherAttendanceById = async (teacherAttendanceId) => {
  const teacherAttendance = await getTeacherAttendanceById(teacherAttendanceId);
  if (!teacherAttendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Teacher attendance not found');
  }
  await teacherAttendance.remove();
  return teacherAttendance;
};

module.exports = {
  createTeacherAttendance,
  queryTeacherAttendances,
  getTeacherAttendanceById,
  updateTeacherAttendanceById,
  deleteTeacherAttendanceById,
};
