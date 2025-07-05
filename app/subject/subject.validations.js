const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");
const createSubject = {
  body: Joi.object().keys({
    title: Joi.string().required().trim(),
    subjectCode: Joi.string().trim().uppercase().allow('', null), // Optional, auto-generated if empty. Validate format if provided.
    description: Joi.string().trim().allow(null, ''),
    creditHours: Joi.number().required().min(0),
    branchId: Joi.string().custom(objectId).required(),
    defaultTeacher: Joi.string().custom(objectId).allow(null),
    schoolId: Joi.string().custom(objectId).optional(), // For rootUser creating subject in a specific school
  }),
};

const getSubjects = {
  query: Joi.object().keys({
    search: Joi.string().allow('', null).description('Search term for title and subjectCode'),
    // title: Joi.string().trim(), // Replaced by 'search'
    // subjectCode: Joi.string().trim(), // Replaced by 'search'
    branchId: Joi.string().custom(objectId).allow('', null),
    schoolId: Joi.string().custom(objectId).optional().description('Filter by school ID (for rootUser)'),
    // gradeId: Joi.string().custom(objectId).allow('', null).description('Filter by grade ID'), // If we add gradeId filter
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string().allow('', null),
  }),
};

const getSubject = {
  params: Joi.object().keys({
    subjectId: Joi.string().custom(objectId).required(),
  }),
};

const updateSubject = {
  params: Joi.object().keys({
    subjectId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().trim(),
      subjectCode: Joi.string().trim().uppercase().allow('', null), // Allow updating subjectCode
      description: Joi.string().trim().allow(null, ''),
      creditHours: Joi.number().min(0),
      branchId: Joi.string().custom(objectId),
      defaultTeacher: Joi.string().custom(objectId).allow(null),
      schoolIdToScopeTo: Joi.string().custom(objectId).optional(), // For rootUser scoping update
    })
    .min(1),
};

const deleteSubject = {
  params: Joi.object().keys({
    subjectId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
};
