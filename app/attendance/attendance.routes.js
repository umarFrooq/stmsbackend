const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const attendanceController= require('./attendance.controller'); // Assuming these are exported from index.js
  const attendanceValidations  = require('./attendance.validations');

const router = express.Router();

// Define roles that can manage attendance
const attendanceManagementRoles = ['teacher', 'staff', 'admin_education'];
router
  .route('/') // For querying attendance records
  .get(auth("attendanceManagement"), validate(attendanceValidations.getAttendances), attendanceController.getAttendancesHandler);

router
  .route('/single') // For marking a single attendance record
  .post(auth("attendanceManagement"), validate(attendanceValidations.markAttendance), attendanceController.markAttendanceHandler);

router
  .route('/bulk') // For marking multiple attendance records
  .post(auth("attendanceManagement"), validate(attendanceValidations.markBulkAttendance), attendanceController.markBulkAttendanceHandler);


router
  .route('/:attendanceId')
  .get(auth("attendanceManagement"), validate(attendanceValidations.getAttendance), attendanceController.getAttendanceHandler)
  .patch(auth("attendanceManagement"), validate(attendanceValidations.updateAttendance), attendanceController.updateAttendanceHandler)
  .delete(auth("attendanceManagement"), validate(attendanceValidations.deleteAttendance), attendanceController.deleteAttendanceHandler);

module.exports = router;
