const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const { paperController, paperValidations } = require('.'); // Assuming these are exported from index.js
const { uploadToS3 } = require('../../config/upload-to-s3'); // Path to S3 upload middleware

const router = express.Router();

// Define roles that can manage papers
const paperManagementRoles = ['teacher', 'staff', 'admin_education'];

router
  .route('/')
  .post(
    auth(paperManagementRoles),
    uploadToS3.single('paperFile'), // Middleware for single file upload to 'paperFile' field
    validate(paperValidations.uploadPaper),
    paperController.uploadPaperHandler
  )
  .get(
    auth(paperManagementRoles), // Or broader access if students/parents can view papers
    validate(paperValidations.getPapers),
    paperController.getPapersHandler
  );

router
  .route('/:paperId')
  .get(
    auth(paperManagementRoles), // Or broader access
    validate(paperValidations.getPaper),
    paperController.getPaperHandler
  )
  .patch(
    auth(paperManagementRoles),
    uploadToS3.single('paperFile'), // For updating/replacing the file
    validate(paperValidations.updatePaper),
    paperController.updatePaperHandler
  )
  .delete(
    auth(paperManagementRoles),
    validate(paperValidations.deletePaper),
    paperController.deletePaperHandler
  );

module.exports = router;
