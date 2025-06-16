const httpStatus = require('http-status');
const { Timetable } = require('.'); // Assuming Timetable model is exported from index.js
const Grade = require('../grade/grade.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const Subject = require('../subject/subject.model'); // Adjust path as needed
const User = require('../user/user.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');

/**
 * Helper to validate related entities for timetable creation/update
 */
const validateTimetableEntities = async (timetableBody) => {
  const { gradeId, branchId, schedule } = timetableBody;

  if (gradeId) {
    const grade = await Grade.findById(gradeId);
    if (!grade) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Grade with ID ${gradeId} not found.`);
    }
    // Validate section if provided with grade
    if (timetableBody.section && !grade.sections.map(s=>s.toUpperCase()).includes(timetableBody.section.toUpperCase())) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Section ${timetableBody.section} not found in Grade ${grade.title}.`);
    }
  }

  if (branchId) {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found.`);
    }
  }

  if (schedule && schedule.length > 0) {
    for (const entry of schedule) {
      if (entry.subjectId) {
        const subject = await Subject.findById(entry.subjectId);
        if (!subject) {
          throw new ApiError(httpStatus.BAD_REQUEST, `Subject with ID ${entry.subjectId} not found in schedule.`);
        }
      }
      if (entry.teacherId) {
        const teacher = await User.findById(entry.teacherId);
        if (!teacher || !['teacher', 'staff', 'admin_education'].includes(teacher.role)) { // Allow staff/admin to be teachers too
          throw new ApiError(httpStatus.BAD_REQUEST, `Teacher with ID ${entry.teacherId} not found or is not a valid teacher/staff.`);
        }
      }
    }
  }
};

/**
 * Deactivate other active timetables for the same grade, section, and branch
 * @param {ObjectId} gradeId
 * @param {String} section
 * @param {ObjectId} branchId
 * @param {ObjectId} [excludeTimetableId] - Timetable ID to exclude from deactivation (e.g., the one being created/updated)
 */
const deactivateOtherActiveTimetables = async (gradeId, section, branchId, excludeTimetableId) => {
  const filter = {
    gradeId,
    section,
    branchId,
    isActive: true,
  };
  if (excludeTimetableId) {
    filter._id = { $ne: excludeTimetableId };
  }
  await Timetable.updateMany(filter, { $set: { isActive: false } });
};

/**
 * Create a timetable
 * @param {Object} timetableBody
 * @param {ObjectId} [createdByUserId] - Optional ID of the user creating the timetable
 * @returns {Promise<Timetable>}
 */
const createTimetable = async (timetableBody, createdByUserId) => {
  await validateTimetableEntities(timetableBody);

  if (timetableBody.isActive === undefined || timetableBody.isActive === true) {
    await deactivateOtherActiveTimetables(timetableBody.gradeId, timetableBody.section, timetableBody.branchId);
    timetableBody.isActive = true; // Ensure it's explicitly true
  }
  
  // Add createdByUserId if needed in schema
  // const timetableData = createdByUserId ? { ...timetableBody, createdBy: createdByUserId } : timetableBody;

  try {
    const timetable = await Timetable.create(timetableBody);
    return timetable;
  } catch (error) {
     if (error.code === 11000 || (error.message && error.message.includes("duplicate key error")) ) {
       throw new ApiError(httpStatus.CONFLICT, 'A timetable for this grade, section, branch, and effective date already exists.');
     }
     throw error;
  }
};

/**
 * Query for timetables
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryTimetables = async (filter, options) => {
  const { populate, ...restOptions } = options;
  let defaultPopulate = 'gradeId:title,branchId:name,schedule.subjectId:title,schedule.teacherId:fullname';
  if (populate) {
    defaultPopulate = populate;
  }

  let query = Timetable.find(filter);

  if (restOptions.sortBy) {
    const sortingCriteria = [];
    restOptions.sortBy.split(',').forEach((sortOption) => {
      const [key, order] = sortOption.split(':');
      sortingCriteria.push((order === 'desc' ? '-' : '') + key);
    });
    query = query.sort(sortingCriteria.join(' '));
  } else {
    query = query.sort('-effectiveDate -createdAt');
  }

  defaultPopulate.split(',').forEach(popField => {
    const [path, select] = popField.split(':');
    query = query.populate({ path, select });
  });

  const timetables = await Timetable.paginate(filter, restOptions, query);
  return timetables;
};

/**
 * Get timetable by id
 * @param {ObjectId} timetableId
 * @param {String} [populateOptions] - Comma separated string of fields to populate
 * @returns {Promise<Timetable>}
 */
const getTimetableById = async (timetableId, populateOptions) => {
  let query = Timetable.findById(timetableId);
  let defaultPopulate = 'gradeId branchId schedule.subjectId schedule.teacherId';
  if (populateOptions) {
    defaultPopulate = populateOptions;
  }
  
  defaultPopulate.split(',').forEach(popField => {
    const [path, select] = popField.split(':');
    query = query.populate({ path, select });
  });
  return query.exec();
};

/**
 * Get the effective timetable for a specific grade, section, branch, and date
 * @param {ObjectId} gradeId
 * @param {String} section
 * @param {ObjectId} branchId
 * @param {Date} date
 * @returns {Promise<Timetable|null>}
 */
const getEffectiveTimetable = async (gradeId, section, branchId, date) => {
  const effectiveDate = date ? new Date(date) : new Date(); // Default to today if no date provided

  const timetable = await Timetable.findOne({
    gradeId,
    section: section.toUpperCase(),
    branchId,
    isActive: true,
    effectiveDate: { $lte: effectiveDate },
  })
  .sort({ effectiveDate: -1 }) // Get the most recent effective one
  .populate('gradeId', 'title')
  .populate('branchId', 'name')
  .populate('schedule.subjectId', 'title subjectCode')
  .populate('schedule.teacherId', 'fullname email'); // Populate with desired fields

  return timetable;
};

/**
 * Update timetable by id
 * @param {ObjectId} timetableId
 * @param {Object} updateBody
 * @param {ObjectId} [updatedByUserId] - Optional ID of the user updating
 * @returns {Promise<Timetable>}
 */
const updateTimetableById = async (timetableId, updateBody, updatedByUserId) => {
  const timetable = await getTimetableById(timetableId);
  if (!timetable) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Timetable not found');
  }

  // Validate related entities if schedule or other linking fields are updated
  await validateTimetableEntities({ ...timetable.toObject(), ...updateBody });
  
  if (updateBody.isActive === true && !timetable.isActive) {
    // If activating this timetable, deactivate others for the same scope
    await deactivateOtherActiveTimetables(timetable.gradeId, timetable.section, timetable.branchId, timetableId);
  } else if (updateBody.isActive === false && timetable.isActive) {
    // If deactivating, ensure there's another active one or handle as per business logic
    // For now, just allow deactivation.
  }
  
  // Add updatedByUserId if needed in schema
  // if (updatedByUserId) updateBody.updatedBy = updatedByUserId;
  
  Object.assign(timetable, updateBody);
  await timetable.save();
  return getTimetableById(timetableId, 'gradeId branchId schedule.subjectId schedule.teacherId'); // Re-fetch with population
};

/**
 * Delete timetable by id
 * @param {ObjectId} timetableId
 * @returns {Promise<Timetable>}
 */
const deleteTimetableById = async (timetableId) => {
  const timetable = await getTimetableById(timetableId);
  if (!timetable) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Timetable not found');
  }
  await timetable.remove();
  return timetable;
};

module.exports = {
  createTimetable,
  queryTimetables,
  getTimetableById,
  getEffectiveTimetable,
  updateTimetableById,
  deleteTimetableById,
};
