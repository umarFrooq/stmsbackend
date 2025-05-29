const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { gradeService } = require('.'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createGradeHandler = catchAsync(async (req, res) => {
  const grade = await gradeService.createGrade(req.body);
  res.status(httpStatus.CREATED).send(grade);
});

const getGradesHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'levelCode', 'branchId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const result = await gradeService.queryGrades(filter, options);
  res.send(result);
});

const getGradeHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const grade = await gradeService.getGradeById(req.params.gradeId, populateOptions);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Grade not found');
  }
  res.send(grade);
});

const updateGradeHandler = catchAsync(async (req, res) => {
  const grade = await gradeService.updateGradeById(req.params.gradeId, req.body);
  res.send(grade);
});

const deleteGradeHandler = catchAsync(async (req, res) => {
  await gradeService.deleteGradeById(req.params.gradeId);
  res.status(httpStatus.NO_CONTENT).send();
});

const addSectionHandler = catchAsync(async (req, res) => {
  const grade = await gradeService.addSectionToGrade(req.params.gradeId, req.body.sectionName);
  res.send(grade);
});

const removeSectionHandler = catchAsync(async (req, res) => {
  const grade = await gradeService.removeSectionFromGrade(req.params.gradeId, req.params.sectionName);
  res.send(grade);
});

const updateSectionsHandler = catchAsync(async (req, res) => {
  const grade = await gradeService.updateSectionsInGrade(req.params.gradeId, req.body.sections);
  res.send(grade);
});

module.exports = {
  createGradeHandler,
  getGradesHandler,
  getGradeHandler,
  updateGradeHandler,
  deleteGradeHandler,
  addSectionHandler,
  removeSectionHandler,
  updateSectionsHandler,
};
