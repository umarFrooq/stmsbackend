const Joi = require('joi');
const { objectId, emptyVal } = require("../auth/custom.validation");
const createSubject = {
  body: Joi.object().keys({
    title: Joi.string().required().trim(),
    // subjectCode: Joi.string().required().trim(),
    description: Joi.string().trim().allow(null, ''), // Allow empty string or null for optional description
    creditHours: Joi.number().required().min(0),
    branchId: Joi.string().custom(objectId).required(),
    defaultTeacher: Joi.string().custom(objectId).allow(null), // Allow null if no default teacher
  }),
};

const getSubjects = {
  query: Joi.object().keys({
    title: Joi.string().trim(),
    subjectCode: Joi.string().trim(),
    branchId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
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
      subjectCode: Joi.boolean(),
      description: Joi.string().trim().allow(null, ''),
      creditHours: Joi.number().min(0),
      branchId: Joi.string().custom(objectId),
      defaultTeacher: Joi.string().custom(objectId).allow(null),
    })
    .min(1), // Requires at least one field to be updated
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
