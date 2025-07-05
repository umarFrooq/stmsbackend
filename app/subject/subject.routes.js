const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const  subjectController = require('./subject.controller'); // Assuming these are exported from index.js
const subjectValidations= require('./subject.validations');
const router = express.Router();

// Define roles that can manage subjects
const subjectManagementRoles = ['admin_education', 'staff'];

// Apply auth and schoolScope middleware generally if all subject ops are school-scoped
// For now, adding specifically to GET routes that need it for listing/viewing within a school context.
// Assuming 'viewSubjects' is a permission for viewing.
router.use(auth()); // Apply general authentication first

router
  .route('/')
  .post(auth("subjectManagement"), validate(subjectValidations.createSubject), subjectController.createSubjectHandler)
  .get(schoolScopeMiddleware, validate(subjectValidations.getSubjects), subjectController.getSubjectsHandler); // Added schoolScopeMiddleware

router
  .route('/:subjectId')
  .get(schoolScopeMiddleware, validate(subjectValidations.getSubject), subjectController.getSubjectHandler) // Added schoolScopeMiddleware
  .patch(auth("subjectManagement"), schoolScopeMiddleware, validate(subjectValidations.updateSubject), subjectController.updateSubjectHandler) // Also scope mutations
  .delete(auth("subjectManagement"), schoolScopeMiddleware, validate(subjectValidations.deleteSubject), subjectController.deleteSubjectHandler); // Also scope mutations

module.exports = router;
