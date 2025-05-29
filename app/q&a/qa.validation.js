const Joi = require("joi");
const { objectId } = require("../auth/custom.validation");

const createQuestion = {
  body: Joi.object().keys({
    question: Joi.string()
    .trim().required().min(1).max(300),
    productId: Joi.string().custom(objectId).required(),
  }),
};

const createAnswer = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    answer: Joi.string()
    .trim().required().min(1).max(300),
  }),
};

const getQAById = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const getAllQa = {
  query: Joi.object().keys({
    productId: Joi.string().custom(objectId).required(),
    limit: Joi.number(),
    page: Joi.number(),
    sortBy: Joi.string(),
  }),
}

const getAllAdminQA = {
  query: Joi.object()
    .keys({
      productId: Joi.string().custom(objectId),
      brandId: Joi.string().custom(objectId),
      userId: Joi.string().custom(objectId),
      limit: Joi.number(),
      page: Joi.number(),
      sortBy: Joi.string(),
      userName: Joi.string(),
      visible:Joi.boolean(),
      brandName: Joi.string(),
      productName: Joi.string(),
      to: Joi.date(),
      from: Joi.date().when(Joi.ref("to"), {
        then: Joi.date().less(Joi.ref("to"))
      }),
    })
    .min(1),
};

const getAllSellerQA = {
  query: Joi.object()
    .keys({
      productId: Joi.string().custom(objectId),
      limit: Joi.number(),
      page: Joi.number(),
      sortBy: Joi.string(),
      productName: Joi.string(),
      to: Joi.date(),
      from: Joi.date().when(Joi.ref("to"), {
        then: Joi.date().less(Joi.ref("to"))
      }),
    })
    .min(1),
};

module.exports = {
  createQuestion,
  createAnswer,
  getQAById,
  getAllQa,
  getAllSellerQA,
  getAllAdminQA,
};
