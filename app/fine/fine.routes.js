const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const { fineController, fineValidations } = require('.'); // Assuming these are exported from index.js

const router = express.Router();

// Define roles for managing fines
const fineManagementRoles = ['staff', 'admin_education'];
// Define roles for viewing fines (broader access)
const fineAccessRoles = ['student', 'teacher', ...fineManagementRoles];

router
  .route('/')
  .post(
    auth(fineManagementRoles),
    validate(fineValidations.issueFine),
    fineController.issueFineHandler
  )
  .get(
    auth(fineAccessRoles),
    validate(fineValidations.getFines),
    fineController.getFinesHandler
  );

router
  .route('/:fineId')
  .get(
    auth(fineAccessRoles),
    validate(fineValidations.getFine),
    fineController.getFineHandler
  );

router
  .route('/:fineId/status') // Specific route for status updates (pay/waive)
  .patch(
    auth(fineManagementRoles),
    validate(fineValidations.updateFineStatus),
    fineController.updateFineStatusHandler
  );

module.exports = router;
