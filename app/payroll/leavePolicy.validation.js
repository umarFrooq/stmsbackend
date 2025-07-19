const Joi = require('joi');
const { objectId } = require('../../utils/joi');

const createLeavePolicy = {
  body: Joi.object().keys({
    school: Joi.string().custom(objectId).required(),
    branch: Joi.string().custom(objectId).required(),
    paidLeavesPerMonth: Joi.number().required(),
  }),
};

const getLeavePolicies = {
  query: Joi.object().keys({
    school: Joi.string().custom(objectId),
    branch: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getLeavePolicy = {
  params: Joi.object().keys({
    leavePolicyId: Joi.string().custom(objectId),
  }),
};

const updateLeavePolicy = {
  params: Joi.object().keys({
    leavePolicyId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      school: Joi.string().custom(objectId),
      branch: Joi.string().custom(objectId),
      paidLeavesPerMonth: Joi.number(),
    })
    .min(1),
};

const deleteLeavePolicy = {
  params: Joi.object().keys({
    leavePolicyId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createLeavePolicy,
  getLeavePolicies,
  getLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
};
