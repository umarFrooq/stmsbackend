const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { paperService } = require('.'); // Assuming service is exported from index.js
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const uploadPaperHandler = catchAsync(async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in req.user
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Paper file is required.');
  }
  const fileUrl = req.file.key; // 'key' is typically the S3 object key from multer-s3

  const paper = await paperService.uploadPaper(req.body, userId, fileUrl);
  res.status(httpStatus.CREATED).send(paper);
});

const getPapersHandler = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'subjectId', 'gradeId', 'branchId', 'year', 'type', 'uploadedBy']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const result = await paperService.queryPapers(filter, options);
  res.send(result);
});

const getPaperHandler = catchAsync(async (req, res) => {
  const populateOptions = req.query.populate;
  const paper = await paperService.getPaperById(req.params.paperId, populateOptions);
  if (!paper) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Paper not found');
  }
  res.send(paper);
});

const updatePaperHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;
  // newFileUrl is undefined if no file is uploaded, or req.file.key if a new file is uploaded.
  // It's NOT null unless explicitly made so, which isn't typical for file uploads directly.
  const newFileUrl = req.file ? req.file.key : undefined; 

  // If the client wants to remove the paperFile (which is required by model),
  // this would be an invalid operation based on current schema.
  // If paperFileUrl was optional, one might pass null for newFileUrl.
  // For now, update implies either keeping the old or providing a new one.
  // If req.body.paperFileUrl is explicitly sent as null, it's ignored here because
  // a new file upload (req.file) takes precedence or no file change occurs.

  const paper = await paperService.updatePaperById(
    req.params.paperId,
    req.body,
    userId,
    newFileUrl // Pass the path of the new file, or undefined if not changing
  );
  res.send(paper);
});

const deletePaperHandler = catchAsync(async (req, res) => {
  await paperService.deletePaperById(req.params.paperId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  uploadPaperHandler,
  getPapersHandler,
  getPaperHandler,
  updatePaperHandler,
  deletePaperHandler,
};
