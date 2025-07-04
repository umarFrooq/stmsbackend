const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware'); // Import middleware
const { feeController, feeValidations } = require('.'); // Assuming these are exported from index.js

const router = express.Router();

// Define permissions (to be added to config/roles.js)
const manageFeesPermission = 'manageFees'; // For create, update, record payment
const viewFeesPermission = 'viewFees';   // For get list, get by ID (students might have this for their own fees, teachers for their class, etc.)

// Apply auth and schoolScope middleware to all fee routes
// Students/parents viewing their own fees will also be implicitly scoped if their user.schoolId is set.
router.use(auth(), schoolScopeMiddleware);

router
  .route('/')
  .post(
    auth(manageFeesPermission),
    validate(feeValidations.createFee),
    feeController.createFeeHandler
  )
  .get(
    auth(viewFeesPermission),
    validate(feeValidations.getFees),
    feeController.getFeesHandler
  );

router
  .route('/:feeId')
  .get(
    auth(viewFeesPermission),
    validate(feeValidations.getFee),
    feeController.getFeeHandler
  )
  .patch(
    auth(manageFeesPermission),
    validate(feeValidations.updateFee),
    feeController.updateFeeHandler
  );

router
  .route('/:feeId/payments')
  .post(
    auth(manageFeesPermission),
    validate(feeValidations.recordPayment),
    feeController.recordPaymentHandler
  );

// Note: Delete fee route is missing, might be intentional or an oversight.
// If needed, it would follow the same pattern:
// .delete(auth(manageFeesPermission), validate(feeValidations.deleteFee), feeController.deleteFeeHandler);

module.exports = router;
