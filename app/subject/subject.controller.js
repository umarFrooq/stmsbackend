const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const  subjectService  = require('./subject.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createSubjectHandler = catchAsync(async (req, res) => {
  const subject = await subjectService.createSubject(req.body,req.user.schoolId);
  res.status(httpStatus.CREATED).send(subject);
});

const getSubjectsHandler = catchAsync(async (req, res) => {
  console.log('Backend subject.controller.js - getSubjectsHandler - req.user:', JSON.stringify(req.user, null, 2));
  console.log('Backend subject.controller.js - getSubjectsHandler - req.user.schoolId:', req.user && req.user.schoolId);

  const filter = pick(req.query, ['title', 'subjectCode', 'branchId', 'defaultTeacher', 'gradeId', 'creditHours']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Ensure req.user and req.user.schoolId are available before proceeding
  if (!req.user || !req.user.schoolId) {
    console.error('Backend subject.controller.js - getSubjectsHandler - User or School ID is missing in req.user.');
    // Consider sending an appropriate error response or handling as per application logic
    // For now, it will likely proceed and fail in the service if schoolId is mandatory there
  }

  const result = await subjectService.querySubjects(filter, options, req.user.schoolId);
  res.send(result);
});

const getSubjectHandler = catchAsync(async (req, res) => {
  const subject = await subjectService.getSubjectById(req.params.subjectId);
  if (!subject) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subject not found');
  }
  res.send(subject);
});

const updateSubjectHandler = catchAsync(async (req, res) => {
  const subject = await subjectService.updateSubjectById(req.params.subjectId, req.body);
  res.send(subject);
});

const deleteSubjectHandler = catchAsync(async (req, res) => {
  await subjectService.deleteSubjectById(req.params.subjectId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createSubjectHandler,
  getSubjectsHandler,
  getSubjectHandler,
  updateSubjectHandler,
  deleteSubjectHandler,
};
