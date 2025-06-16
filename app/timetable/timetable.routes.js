const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const { timetableController, timetableValidations } = require('.'); // Assuming these are exported from index.js

const router = express.Router();

// Define roles that can manage timetables
const timetableManagementRoles = ['staff', 'admin_education'];
// Define roles that can view timetables (broader access)
const timetableAccessRoles = ['student', 'teacher', ...timetableManagementRoles];


// The getTimetablesHandler in the controller is designed to handle both general queries
// and a specific query for an effective timetable based on gradeId, section, branchId, and date.
// So, a separate '/effective' route might be redundant if the controller logic is robust.
router
  .route('/')
  .post(
    auth(timetableManagementRoles),
    validate(timetableValidations.createTimetable),
    timetableController.createTimetableHandler
  )
  .get(
    auth(timetableAccessRoles), // Allow broader access for viewing
    validate(timetableValidations.getTimetables), // Validation handles different query param combinations
    timetableController.getTimetablesHandler
  );

router
  .route('/:timetableId')
  .get(
    auth(timetableAccessRoles), // Allow broader access for viewing
    validate(timetableValidations.getTimetable),
    timetableController.getTimetableHandler
  )
  .patch(
    auth(timetableManagementRoles),
    validate(timetableValidations.updateTimetable),
    timetableController.updateTimetableHandler
  )
  .delete(
    auth(timetableManagementRoles),
    validate(timetableValidations.deleteTimetable),
    timetableController.deleteTimetableHandler
  );

module.exports = router;
