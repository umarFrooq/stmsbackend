const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const  subjectService  = require('./subject.service'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createSubjectHandler = catchAsync(async (req, res) => {
  const subject = await subjectService.createSubject(req.body);
  res.status(httpStatus.CREATED).send(subject);
});

const getSubjectsHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'subjectCode', 'branchId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await subjectService.querySubjects(filter, options);
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
