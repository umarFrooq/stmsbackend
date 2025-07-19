const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware');
const payrollController = require('./payroll.controller');
const payrollValidation = require('./payroll.validations');

const router = express.Router();

router.use(auth(), schoolScopeMiddleware);

router
  .route('/')
  .post(auth('managePayrolls'), validate(payrollValidation.generatePayroll), payrollController.generatePayroll)
  .get(auth('viewPayrolls', 'viewOwnPayrolls'), validate(payrollValidation.getPayrolls), payrollController.getPayrolls);

router
  .route('/:payrollId')
  .get(auth('viewPayrolls', 'viewOwnPayrolls'), validate(payrollValidation.getPayroll), payrollController.getPayroll)
  .patch(auth('managePayrolls'), validate(payrollValidation.updatePayroll), payrollController.updatePayroll)
  .delete(auth('managePayrolls'), validate(payrollValidation.deletePayroll), payrollController.deletePayroll);

module.exports = router;
