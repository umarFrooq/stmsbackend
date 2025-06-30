const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");
const {braches}=require('../../config/enums')
const createBranch = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    // head: Joi.string().custom(objectId),
    address: Joi.object().required(),
    branchCode: Joi.string().trim(),
    type:Joi.string().valid(...Object.values(braches)
)  }),
};

const getBranches = {
  query: Joi.object().keys({
    name: Joi.string(),
    branchCode: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getBranch = {
  params: Joi.object().keys({
    branchId: Joi.string().custom(objectId).required(),
  }),
};

const updateBranch = {
  params: Joi.object().keys({
    branchId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      address: Joi.object(),
      branchCode: Joi.string().trim(),
      type:Joi.string().valid(...Object.values(braches))
    })
    .min(1),
};

const deleteBranch = {
  params: Joi.object().keys({
    branchId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  deleteBranch,
};
