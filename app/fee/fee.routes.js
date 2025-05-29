const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const { feeController, feeValidations } = require('.'); // Assuming these are exported from index.js

const router = express.Router();

// Define roles for managing fees
const feeManagementRoles = ['staff', 'admin_education'];
// Define roles for viewing fees (broader access)
const feeAccessRoles = ['student', 'teacher', ...feeManagementRoles];

router
  .route('/')
  .post(
    auth(feeManagementRoles),
    validate(feeValidations.createFee),
    feeController.createFeeHandler
  )
  .get(
    auth(feeAccessRoles),
    validate(feeValidations.getFees),
    feeController.getFeesHandler
  );

router
  .route('/:feeId')
  .get(
    auth(feeAccessRoles),
    validate(feeValidations.getFee),
    feeController.getFeeHandler
  )
  .patch( // For general updates like discount, description, or waiving
    auth(feeManagementRoles),
    validate(feeValidations.updateFee),
    feeController.updateFeeHandler
  );

router
  .route('/:feeId/payments')
  .post(
    auth(feeManagementRoles),
    validate(feeValidations.recordPayment),
    feeController.recordPaymentHandler
  );

// Placeholder route for applying a fine - if it were to be a direct API action
// router
//   .route('/:feeId/apply-fine')
//   .post(
//     auth(feeManagementRoles),
//     validate(feeValidations.applyFine), // Would need a validation schema for fineId in body
//     feeController.applyFineHandler // Would need a controller handler
//   );

module.exports = router;
