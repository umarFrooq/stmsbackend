const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const schoolService = require('./school.service');
const ApiError = require('../../utils/ApiError');

const createSchoolHandler = catchAsync(async (req, res) => {
  const { nameOfSchool, adminEmail } = req.body;
  // The schoolService.createSchoolAndAdmin expects the first param as an object {nameOfSchool: ...}
  const result = await schoolService.createSchoolAndAdmin({ nameOfSchool }, adminEmail);
  res.status(httpStatus.CREATED).send(result);
});

const getSchoolsHandler = catchAsync(async (req, res) => {
  // Updated to pick new filter parameters: search, status, type, city
  const filter = pick(req.query, ['search', 'status', 'type', 'city']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']); // Added populate
  const result = await schoolService.querySchools(filter, options);
  res.send(result);
});

const getSchoolHandler = catchAsync(async (req, res) => {
  const school = await schoolService.getSchoolById(req.params.schoolId);
  // getSchoolById service function already throws ApiError if not found,
  // so no need to check for !school here explicitly unless adding more logic.
  res.send(school);
});

const updateSchoolHandler = catchAsync(async (req, res) => {
  // The service's updateSchoolById expects the name to be 'name' if passed in body,
  // but validation takes 'nameOfSchool'. We should be consistent.
  // Let's assume validation sends `nameOfSchool` and service expects `name`.
  // Or, adjust validation/service to use consistent naming.
  // For now, if req.body.nameOfSchool exists, map it to req.body.name for the service.
  const updateBody = { ...req.body };
  if (updateBody.nameOfSchool) {
    updateBody.name = updateBody.nameOfSchool;
    delete updateBody.nameOfSchool; // Clean up to avoid confusion in service
  }

  const school = await schoolService.updateSchoolById(req.params.schoolId, updateBody);
  res.send(school);
});

const deleteSchoolHandler = catchAsync(async (req, res) => {
  await schoolService.deleteSchoolById(req.params.schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createSchoolHandler,
  getSchoolsHandler,
  getSchoolHandler,
  updateSchoolHandler,
  deleteSchoolHandler,
};
