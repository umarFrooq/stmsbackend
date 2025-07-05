const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");

const schoolStatusEnum = ['active', 'inactive', 'pending_approval', 'suspended'];
const schoolTypeEnum = ['public', 'private', 'charter', 'international', 'special_education', 'other'];

const createSchool = {
  body: Joi.object().keys({
    nameOfSchool: Joi.string().required().min(1).trim(),
    adminEmail: Joi.string().required().email(),
    schoolCode: Joi.string().required().trim().uppercase(),
    status: Joi.string().valid(...schoolStatusEnum).default('pending_approval'),
    type: Joi.string().valid(...schoolTypeEnum).trim().allow('', null),
    address: Joi.object({
      street: Joi.string().trim().allow('', null),
      city: Joi.string().trim().allow('', null),
      state: Joi.string().trim().allow('', null),
      postalCode: Joi.string().trim().allow('', null),
      country: Joi.string().trim().allow('', null),
    }).allow(null),
  }),
};

const getSchools = {
  query: Joi.object().keys({
    // name: Joi.string(), // Will be covered by 'search'
    search: Joi.string().allow('', null).description('Search by school name or code'),
    status: Joi.string().valid(...schoolStatusEnum, '').allow(null).description('Filter by status'),
    type: Joi.string().valid(...schoolTypeEnum, '').allow(null).description('Filter by type'),
    city: Joi.string().trim().allow('', null).description('Filter by city'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string().allow('', null), // Allow populate if needed in future
  }),
};

const getSchool = {
  params: Joi.object().keys({
    schoolId: Joi.string().custom(objectId).required(),
  }),
};

const updateSchool = {
  params: Joi.object().keys({
    schoolId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      nameOfSchool: Joi.string().min(1).trim(),
      schoolCode: Joi.string().trim().uppercase(),
      status: Joi.string().valid(...schoolStatusEnum),
      type: Joi.string().valid(...schoolTypeEnum).trim().allow('', null),
      address: Joi.object({
        street: Joi.string().trim().allow('', null),
        city: Joi.string().trim().allow('', null),
        state: Joi.string().trim().allow('', null),
        postalCode: Joi.string().trim().allow('', null),
        country: Joi.string().trim().allow('', null),
      }).allow(null),
    })
    .min(1),
};

const deleteSchool = {
  params: Joi.object().keys({
    schoolId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createSchool,
  getSchools,
  getSchool,
  updateSchool,
  deleteSchool,
};
