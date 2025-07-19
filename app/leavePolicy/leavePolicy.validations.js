const Joi = require('joi');
const { objectId } = require('../../utils/joi.custom.validation');

const createLeavePolicy = {
  body: Joi.object().keys({
    branchId: Joi.string().custom(objectId).required(),
    paidLeavesPerMonth: Joi.number().min(0).required(),
  }),
};

const getLeavePolicy = {
  params: Joi.object().keys({
    branchId: Joi.string().custom(objectId).required(),
  }),
};

const updateLeavePolicy = {
  params: Joi.object().keys({
    branchId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    paidLeavesPerMonth: Joi.number().min(0),
  }),
};

module.exports = {
  createLeavePolicy,
  getLeavePolicy,
  updateLeavePolicy,
};
