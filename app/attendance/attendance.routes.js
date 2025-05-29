const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const { attendanceController, attendanceValidations } = require('.'); // Assuming these are exported from index.js

const router = express.Router();

// Define roles that can manage attendance
const attendanceManagementRoles = ['teacher', 'staff', 'admin_education'];

router
  .route('/single') // For marking a single attendance record
  .post(auth(attendanceManagementRoles), validate(attendanceValidations.markAttendance), attendanceController.markAttendanceHandler);

router
  .route('/bulk') // For marking multiple attendance records
  .post(auth(attendanceManagementRoles), validate(attendanceValidations.markBulkAttendance), attendanceController.markBulkAttendanceHandler);

router
  .route('/') // For querying attendance records
  .get(auth(attendanceManagementRoles), validate(attendanceValidations.getAttendances), attendanceController.getAttendancesHandler);

router
  .route('/:attendanceId')
  .get(auth(attendanceManagementRoles), validate(attendanceValidations.getAttendance), attendanceController.getAttendanceHandler)
  .patch(auth(attendanceManagementRoles), validate(attendanceValidations.updateAttendance), attendanceController.updateAttendanceHandler)
  .delete(auth(attendanceManagementRoles), validate(attendanceValidations.deleteAttendance), attendanceController.deleteAttendanceHandler);

module.exports = router;
