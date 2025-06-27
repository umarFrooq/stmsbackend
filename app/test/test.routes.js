const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const  testController = require('./test.controller'); // Assuming these are exported from index.js
const  testValidations  = require('./test.validations');
const router = express.Router();

// Define roles that can manage tests
const testManagementRoles = ['teacher', 'staff', 'admin_education'];

router
  .route('/')
  .post(auth("testManagement"), validate(testValidations.createTest), testController.createTestHandler)
  .get(auth("testManagement"), validate(testValidations.getTests), testController.getTestsHandler); // Or broader access if needed

router
  .route('/:testId')
  .get(auth("testManagement"), validate(testValidations.getTest), testController.getTestHandler) // Or broader access
  .patch(auth("testManagement"), validate(testValidations.updateTest), testController.updateTestHandler)
  .delete(auth("testManagement"), validate(testValidations.deleteTest), testController.deleteTestHandler);

module.exports = router;
