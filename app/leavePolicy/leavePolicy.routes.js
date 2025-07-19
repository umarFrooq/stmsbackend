const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware');
const leavePolicyController = require('./leavePolicy.controller');
const leavePolicyValidation = require('./leavePolicy.validations');

const router = express.Router();

router.use(auth(), schoolScopeMiddleware);

router
  .route('/')
  .post(
    auth('manageLeavePolicies'),
    validate(leavePolicyValidation.createLeavePolicy),
    leavePolicyController.createLeavePolicy
  );

router
  .route('/:branchId')
  .get(auth('manageLeavePolicies'), validate(leavePolicyValidation.getLeavePolicy), leavePolicyController.getLeavePolicy)
  .patch(
    auth('manageLeavePolicies'),
    validate(leavePolicyValidation.updateLeavePolicy),
    leavePolicyController.updateLeavePolicy
  );

module.exports = router;
