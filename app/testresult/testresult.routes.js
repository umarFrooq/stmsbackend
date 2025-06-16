const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const { testResultController, testResultValidations } = require('.'); // Assuming these are exported from index.js
const { uploadToS3 } = require('../../config/upload-to-s3'); // Path to S3 upload middleware

const router = express.Router();

// Define roles that can manage test results
const testResultManagementRoles = ['teacher', 'staff', 'admin_education'];

router
  .route('/')
  .post(
    auth(testResultManagementRoles),
    // uploadToS3.single('answerSheetImage'), // Middleware for single file upload to 'answerSheetImage' field
    validate(testResultValidations.createTestResult),
    testResultController.createTestResultHandler
  )
  .get(
    auth(testResultManagementRoles), // Or broader access if students/parents can view their results
    validate(testResultValidations.getTestResults),
    testResultController.getTestResultsHandler
  );

router
  .route('/:resultId')
  .get(
    auth(testResultManagementRoles), // Or broader access
    validate(testResultValidations.getTestResult),
    testResultController.getTestResultHandler
  )
  .patch(
    auth(testResultManagementRoles),
    // uploadToS3.single('answerSheetImage'), // For updating/replacing the image
    validate(testResultValidations.updateTestResult),
    testResultController.updateTestResultHandler
  )
  .delete(
    auth(testResultManagementRoles),
    validate(testResultValidations.deleteTestResult),
    testResultController.deleteTestResultHandler
  );

module.exports = router;
