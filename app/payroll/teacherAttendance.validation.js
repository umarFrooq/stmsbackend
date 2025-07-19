const Joi = require('joi');
const { objectId } = require('../../utils/joi');

const createTeacherAttendance = {
  body: Joi.object().keys({
    teacher: Joi.string().custom(objectId).required(),
    school: Joi.string().custom(objectId).required(),
    branch: Joi.string().custom(objectId).required(),
    date: Joi.date().required(),
    status: Joi.string().valid('Present', 'Absent', 'Leave').required(),
  }),
};

const getTeacherAttendances = {
  query: Joi.object().keys({
    teacher: Joi.string().custom(objectId),
    date: Joi.date(),
    status: Joi.string(),
    branch: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTeacherAttendance = {
  params: Joi.object().keys({
    teacherAttendanceId: Joi.string().custom(objectId),
  }),
};

const updateTeacherAttendance = {
  params: Joi.object().keys({
    teacherAttendanceId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      teacher: Joi.string().custom(objectId),
      school: Joi.string().custom(objectId),
      branch: Joi.string().custom(objectId),
      date: Joi.date(),
      status: Joi.string().valid('Present', 'Absent', 'Leave'),
    })
    .min(1),
};

const deleteTeacherAttendance = {
  params: Joi.object().keys({
    teacherAttendanceId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createTeacherAttendance,
  getTeacherAttendances,
  getTeacherAttendance,
  updateTeacherAttendance,
  deleteTeacherAttendance,
};
