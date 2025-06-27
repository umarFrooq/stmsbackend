const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const  timetableService  = require('./timetable.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createTimetableHandler = catchAsync(async (req, res) => {
  // const createdByUserId = req.user.id; // Assuming user ID is available in req.user
  const timetable = await timetableService.createTimetable(req.body /*, createdByUserId*/);
  res.status(httpStatus.CREATED).send(timetable);
});

const getTimetablesHandler = catchAsync(async (req, res) => {
  const { gradeId, section, branchId, date, ...otherFilters } = req.query;
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  
  let result;
  if (gradeId && section && branchId && date) { // For effective timetable query
    result = await timetableService.getEffectiveTimetable(gradeId, section, branchId, new Date(date));
    if (!result) {
        // Send an empty object or specific structure if no effective timetable is found,
        // instead of 404, as it's a valid query that might yield no result.
        return res.send({}); 
    }
  } else { // For general query
    const filter = pick({ gradeId, section, branchId, ...otherFilters }, ['gradeId', 'section', 'branchId', 'isActive']);
    result = await timetableService.queryTimetables(filter, options);
  }
  res.send(result);
});

const getTimetableHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const timetable = await timetableService.getTimetableById(req.params.timetableId, populateOptions);
  if (!timetable) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Timetable not found');
  }
  res.send(timetable);
});

const updateTimetableHandler = catchAsync(async (req, res) => {
  // const updatedByUserId = req.user.id; // Assuming user ID is available
  const timetable = await timetableService.updateTimetableById(req.params.timetableId, req.body /*, updatedByUserId*/);
  res.send(timetable);
});

const deleteTimetableHandler = catchAsync(async (req, res) => {
  await timetableService.deleteTimetableById(req.params.timetableId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTimetableHandler,
  getTimetablesHandler,
  getTimetableHandler,
  updateTimetableHandler,
  deleteTimetableHandler,
};
