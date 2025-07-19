const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const teacherAttendanceValidation = require('./teacherAttendance.validation');
const teacherAttendanceController = require('./teacherAttendance.controller');

const router = express.Router();

router
  .route('/')
  .post(
    auth('manageTeacherAttendances'),
    validate(teacherAttendanceValidation.createTeacherAttendance),
    teacherAttendanceController.createTeacherAttendance
  )
  .get(
    auth('getTeacherAttendances'),
    validate(teacherAttendanceValidation.getTeacherAttendances),
    teacherAttendanceController.getTeacherAttendances
  );

router
  .route('/:teacherAttendanceId')
  .get(
    auth('getTeacherAttendances'),
    validate(teacherAttendanceValidation.getTeacherAttendance),
    teacherAttendanceController.getTeacherAttendance
  )
  .patch(
    auth('manageTeacherAttendances'),
    validate(teacherAttendanceValidation.updateTeacherAttendance),
    teacherAttendanceController.updateTeacherAttendance
  )
  .delete(
    auth('manageTeacherAttendances'),
    validate(teacherAttendanceValidation.deleteTeacherAttendance),
    teacherAttendanceController.deleteTeacherAttendance
  );

module.exports = router;
