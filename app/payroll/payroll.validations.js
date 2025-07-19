const Joi = require('joi');
const { objectId } = require('../../utils/joi.custom.validation');

const generatePayroll = {
  body: Joi.object().keys({
    teacherId: Joi.string().custom(objectId).required(),
    branchId: Joi.string().custom(objectId).required(),
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().required(),
    basicSalary: Joi.number().required(),
    totalWorkingDays: Joi.number().integer().required(),
  }),
};

const getPayrolls = {
  query: Joi.object().keys({
    teacherId: Joi.string().custom(objectId),
    branchId: Joi.string().custom(objectId),
    month: Joi.number().integer().min(1).max(12),
    year: Joi.number().integer(),
    status: Joi.string().valid('paid', 'unpaid'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getPayroll = {
  params: Joi.object().keys({
    payrollId: Joi.string().custom(objectId).required(),
  }),
};

const updatePayroll = {
  params: Joi.object().keys({
    payrollId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid('paid', 'unpaid'),
      paidOn: Joi.date(),
    })
    .min(1),
};

const deletePayroll = {
  params: Joi.object().keys({
    payrollId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  generatePayroll,
  getPayrolls,
  getPayroll,
  updatePayroll,
  deletePayroll,
};
