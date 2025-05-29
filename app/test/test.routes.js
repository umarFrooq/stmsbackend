const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const { testController, testValidations } = require('.'); // Assuming these are exported from index.js

const router = express.Router();

// Define roles that can manage tests
const testManagementRoles = ['teacher', 'staff', 'admin_education'];

router
  .route('/')
  .post(auth(testManagementRoles), validate(testValidations.createTest), testController.createTestHandler)
  .get(auth(testManagementRoles), validate(testValidations.getTests), testController.getTestsHandler); // Or broader access if needed

router
  .route('/:testId')
  .get(auth(testManagementRoles), validate(testValidations.getTest), testController.getTestHandler) // Or broader access
  .patch(auth(testManagementRoles), validate(testValidations.updateTest), testController.updateTestHandler)
  .delete(auth(testManagementRoles), validate(testValidations.deleteTest), testController.deleteTestHandler);

module.exports = router;
