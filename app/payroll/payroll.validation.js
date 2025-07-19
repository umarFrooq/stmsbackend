const Joi = require('joi');
const { objectId } = require('../../utils/joi');

const createPayroll = {
  body: Joi.object().keys({
    teacher: Joi.string().custom(objectId).required(),
    school: Joi.string().custom(objectId).required(),
    branch: Joi.string().custom(objectId).required(),
    month: Joi.number().required(),
    year: Joi.number().required(),
    basicSalary: Joi.number().required(),
    bonus: Joi.number(),
    deductions: Joi.number(),
    netSalary: Joi.number().required(),
    status: Joi.string().valid('Paid', 'Unpaid'),
  }),
};

const getPayrolls = {
  query: Joi.object().keys({
    teacher: Joi.string().custom(objectId),
    month: Joi.number(),
    year: Joi.number(),
    status: Joi.string(),
    branch: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getPayroll = {
  params: Joi.object().keys({
    payrollId: Joi.string().custom(objectId),
  }),
};

const updatePayroll = {
  params: Joi.object().keys({
    payrollId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
        teacher: Joi.string().custom(objectId),
        school: Joi.string().custom(objectId),
        branch: Joi.string().custom(objectId),
        month: Joi.number(),
        year: Joi.number(),
        basicSalary: Joi.number(),
        bonus: Joi.number(),
        deductions: Joi.number(),
        netSalary: Joi.number(),
        status: Joi.string().valid('Paid', 'Unpaid'),
    })
    .min(1),
};

const deletePayroll = {
  params: Joi.object().keys({
    payrollId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createPayroll,
  getPayrolls,
  getPayroll,
  updatePayroll,
  deletePayroll,
};
