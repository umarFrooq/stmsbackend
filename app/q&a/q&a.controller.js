const qaService = require("./q&a.service");
const catchAsync = require("../../utils/catchAsync");
const ApiError = require("../../utils/ApiError");
const httpStatus = require("http-status");
const pick = require("../../utils/pick");

const createQuestion = catchAsync(async (req, res) => {
  const result = await qaService.createQuestion(req.body, req.user);
  res.status(httpStatus.CREATED).send(result);
});

const createAnswer = catchAsync(async (req, res) => {
  const result = await qaService.createAnswer(
    req.params.id,
    req.body,
    req.user
  );
  res.status(httpStatus.CREATED).send(result);
});

const qaById = catchAsync(async (req, res) => {
  const result = await qaService.qaById(req.params.id);
  res.status(httpStatus.OK).send(result);
});

const deleteQa = catchAsync(async (req, res) => {
  const result = await qaService.deleteQa(req.params.id);
  res.status(httpStatus.OK).send(result);
});

const getAllQa = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["productName", "productId"]);
  const options = pick(req.query, ["limit", "page", "sortBy"]);
  const result = await qaService.getAllQa(filter, options);
  res.status(httpStatus.OK).send(result);
});

const getAllAdminQA = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    "productName",
    "productId",
    "brandName",
    "userName",
    "userId",
    "brandId",
    "sellerId",
    "visible",
    "to",
    "from",
  ]);
  const options = pick(req.query, ["limit", "page", "sortBy"]);
  const result = await qaService.getAllQa(filter, options, req.user);
  res.status(httpStatus.OK).send(result);
});

const getAllSellerQA = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["productName", "productId","visible", "to", "from"]);
  const options = pick(req.query, ["limit", "page", "sortBy"]);
  const result = await qaService.getAllQa(filter, options, req.user);
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  createQuestion,
  createAnswer,
  getAllQa,
  qaById,
  deleteQa,
  getAllAdminQA,
  getAllSellerQA,
};
