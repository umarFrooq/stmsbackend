const Joi = require('joi');
const { objectId } = require('../../utils/joi.custom.validation');

const markTeacherAttendance = {
  body: Joi.object().keys({
    teacherId: Joi.string().custom(objectId).required(),
    branchId: Joi.string().custom(objectId).required(),
    date: Joi.date().required(),
    status: Joi.string().valid('present', 'absent', 'leave', 'sick_leave', 'half_day_leave').required(),
    remarks: Joi.string().allow(''),
  }),
};

const getTeacherAttendances = {
  query: Joi.object().keys({
    teacherId: Joi.string().custom(objectId),
    branchId: Joi.string().custom(objectId),
    date: Joi.date(),
    status: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTeacherAttendance = {
  params: Joi.object().keys({
    attendanceId: Joi.string().custom(objectId).required(),
  }),
};

const updateTeacherAttendance = {
  params: Joi.object().keys({
    attendanceId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      date: Joi.date(),
      status: Joi.string().valid('present', 'absent', 'leave', 'sick_leave', 'half_day_leave'),
      remarks: Joi.string().allow(''),
    })
    .min(1),
};

const deleteTeacherAttendance = {
  params: Joi.object().keys({
    attendanceId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  markTeacherAttendance,
  getTeacherAttendances,
  getTeacherAttendance,
  updateTeacherAttendance,
  deleteTeacherAttendance,
};
