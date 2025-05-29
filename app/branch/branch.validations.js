const Joi = require('joi');
const { objectId } = require('../../utils/joi.custom.validation');

const createBranch = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    head: Joi.string().custom(objectId),
    addressId: Joi.string().custom(objectId).required(),
    branchCode: Joi.string().trim(),
  }),
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
      head: Joi.string().custom(objectId),
      addressId: Joi.string().custom(objectId),
      branchCode: Joi.string().trim(),
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
