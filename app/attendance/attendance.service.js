const httpStatus = require('http-status');
const { Attendance } = require('./attendance.model'); // Assuming Attendance model is exported from index.js
const User = require('../user/user.model'); // Adjust path as needed
const Subject = require('../subject/subject.model'); // Adjust path as needed
const Grade = require('../grade/grade.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose');

/**
 * Helper to validate related entities for a single attendance record
 */
const validateAttendanceEntities = async (attendanceBody) => {
  const { studentId, subjectId, gradeId, branchId, section } = attendanceBody;

  const student = await User.findById(studentId);
  if (!student || !['student', 'user'].includes(student.role) ) { // Assuming 'user' can also be a student for flexibility
    throw new ApiError(httpStatus.BAD_REQUEST, `Student with ID ${studentId} not found or is not a student.`);
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Subject with ID ${subjectId} not found.`);
  }

  const grade = await Grade.findById(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Grade with ID ${gradeId} not found.`);
  }
  if (!grade.sections.map(s=>s.toUpperCase()).includes(section.toUpperCase())) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Section ${section} not found in Grade ${grade.title}.`);
  }

  const branch = await Branch.findById(branchId);
  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found.`);
  }

  // Ensure all entities belong to the same branch (if applicable, e.g. subject.branchId)
  if (subject.branchId.toString() !== branchId) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Subject ${subject.title} does not belong to branch ${branch.name}.`);
  }
  if (grade.branchId.toString() !== branchId) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Grade ${grade.title} does not belong to branch ${branch.name}.`);
  }
   // TODO: Future: Check if student is enrolled in this grade/section/subject. This requires an enrollment module.
};


/**
 * Mark a single attendance record
 * @param {Object} attendanceBody
 * @param {ObjectId} markedByUserId - ID of the user marking attendance
 * @returns {Promise<Attendance>}
 */
const markSingleAttendance = async (attendanceBody, markedByUserId) => {
  await validateAttendanceEntities(attendanceBody);
  
  try {
    const attendance = await Attendance.create({ ...attendanceBody, markedBy: markedByUserId });
    return attendance;
  } catch (error) {
    if (error.code === 11000 || error.message.includes("duplicate key error")) { // Mongoose duplicate key error
      throw new ApiError(httpStatus.CONFLICT, 'Attendance record for this student, subject, grade, section and date already exists.');
    }
    throw error; // Re-throw other errors
  }
};

/**
 * Mark bulk attendance records
 * @param {Array<Object>} attendanceEntriesArray
 * @param {ObjectId} markedByUserId - ID of the user marking attendance
 * @returns {Promise<{success: Array<Attendance>, errors: Array<Object>}>}
 */
const markBulkAttendance = async (attendanceEntriesArray, markedByUserId) => {
  const results = {
    success: [],
    errors: [],
  };

  for (const entry of attendanceEntriesArray) {
    try {
      await validateAttendanceEntities(entry); // Validate each entry
      // Check for duplicates within the batch before DB insert (if dates, students, subjects are the same)
      // This is a simple check; more complex scenarios might need different handling.
      const existingInBatch = results.success.find(s => 
        s.studentId.toString() === entry.studentId &&
        s.subjectId.toString() === entry.subjectId &&
        s.gradeId.toString() === entry.gradeId &&
        s.section === entry.section &&
        new Date(s.date).toISOString().split('T')[0] === new Date(entry.date).toISOString().split('T')[0]
      );
      if (existingInBatch) {
          results.errors.push({ entry, error: 'Duplicate entry in this batch.' });
          continue;
      }

      const attendance = await Attendance.create({ ...entry, markedBy: markedByUserId });
      results.success.push(attendance);
    } catch (error) {
       if (error.code === 11000 || (error.message && error.message.includes("duplicate key error")) ) {
         results.errors.push({ entry, error: 'Attendance record for this student, subject, grade, section and date already exists in DB.' });
       } else if (error instanceof ApiError) {
        results.errors.push({ entry, error: error.message });
      } else {
        results.errors.push({ entry, error: 'An unexpected error occurred.' });
      }
    }
  }
  return results;
};

/**
 * Query for attendance records
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryAttendances = async (filter, options) => {
  const { populate, ...restOptions } = options;
  
  // Handle date range queries
  if (filter.startDate && filter.endDate) {
    filter.date = { $gte: new Date(filter.startDate), $lte: new Date(filter.endDate) };
    delete filter.startDate;
    delete filter.endDate;
  } else if (filter.startDate) {
    filter.date = { $gte: new Date(filter.startDate) };
    delete filter.startDate;
  } else if (filter.endDate) {
    filter.date = { $lte: new Date(filter.endDate) };
    delete filter.endDate;
  }


  let query = Attendance.find(filter);
  if (restOptions.sortBy) {
    const sortingCriteria = [];
    restOptions.sortBy.split(',').forEach((sortOption) => {
      const [key, order] = sortOption.split(':');
      sortingCriteria.push((order === 'desc' ? '-' : '') + key);
    });
    query = query.sort(sortingCriteria.join(' '));
  } else {
    query = query.sort('-date -createdAt'); // Default sort
  }
  
  // Manual population logic
  if (populate) {
    populate.split(',').forEach((populateOption) => {
      const parts = populateOption.split(':');
      let path = parts[0];
      let select = parts.length > 1 ? parts.slice(1).join(' ') : '';
      query = query.populate({ path, select });
    });
  }

  const attendances = await Attendance.paginate(filter, restOptions, query);
  return attendances;
};

/**
 * Get attendance record by id
 * @param {ObjectId} id
 * @param {String} populateOptions - Comma separated string of fields to populate
 * @returns {Promise<Attendance>}
 */
const getAttendanceById = async (id, populateOptions) => {
  let query = Attendance.findById(id);
  if (populateOptions) {
    populateOptions.split(',').forEach((populateOption) => {
        const parts = populateOption.split(':');
        let path = parts[0];
        let select = parts.length > 1 ? parts.slice(1).join(' ') : '';
        query = query.populate({ path, select });
    });
  }
  return query.exec();
};

/**
 * Update attendance record by id
 * @param {ObjectId} attendanceId
 * @param {Object} updateBody
 * @param {ObjectId} updatedByUserId - ID of the user performing the update
 * @returns {Promise<Attendance>}
 */
const updateAttendanceById = async (attendanceId, updateBody, updatedByUserId) => {
  const attendance = await getAttendanceById(attendanceId);
  if (!attendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attendance record not found');
  }

  // Add any specific validation for updates if needed, e.g., cannot change studentId or subjectId
  Object.assign(attendance, updateBody, { markedBy: updatedByUserId }); // Ensure markedBy is updated
  await attendance.save();
  return attendance;
};

/**
 * Delete attendance record by id
 * @param {ObjectId} attendanceId
 * @returns {Promise<Attendance>}
 */
const deleteAttendanceById = async (attendanceId) => {
  const attendance = await getAttendanceById(attendanceId);
  if (!attendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attendance record not found');
  }
  await attendance.remove();
  return attendance;
};

module.exports = {
  markSingleAttendance,
  markBulkAttendance,
  queryAttendances,
  getAttendanceById,
  updateAttendanceById,
  deleteAttendanceById,
};
