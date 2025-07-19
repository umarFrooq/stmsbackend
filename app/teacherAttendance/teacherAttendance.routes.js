const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware');
const teacherAttendanceController = require('./teacherAttendance.controller');
const teacherAttendanceValidation = require('./teacherAttendance.validations');

const router = express.Router();

router.use(auth(), schoolScopeMiddleware);

router
  .route('/')
  .post(
    auth('manageTeacherAttendances'),
    validate(teacherAttendanceValidation.markTeacherAttendance),
    teacherAttendanceController.markTeacherAttendance
  )
  .get(
    auth('manageTeacherAttendances'),
    validate(teacherAttendanceValidation.getTeacherAttendances),
    teacherAttendanceController.getTeacherAttendances
  );

router
  .route('/:attendanceId')
  .get(
    auth('manageTeacherAttendances'),
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
