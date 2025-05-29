const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const { subjectController, subjectValidations } = require('.'); // Assuming these are exported from index.js

const router = express.Router();

// Define roles that can manage subjects
const subjectManagementRoles = ['admin_education', 'staff'];

router
  .route('/')
  .post(auth(subjectManagementRoles), validate(subjectValidations.createSubject), subjectController.createSubjectHandler)
  .get(validate(subjectValidations.getSubjects), subjectController.getSubjectsHandler); // Publicly accessible or add auth as needed

router
  .route('/:subjectId')
  .get(validate(subjectValidations.getSubject), subjectController.getSubjectHandler) // Publicly accessible or add auth as needed
  .patch(auth(subjectManagementRoles), validate(subjectValidations.updateSubject), subjectController.updateSubjectHandler)
  .delete(auth(subjectManagementRoles), validate(subjectValidations.deleteSubject), subjectController.deleteSubjectHandler);

module.exports = router;
