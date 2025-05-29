const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const { gradeController, gradeValidations } = require('.'); // Assuming these are exported from index.js

const router = express.Router();

// Define roles that can manage grades and their sections
const gradeManagementRoles = ['admin_education', 'staff'];

router
  .route('/')
  .post(auth(gradeManagementRoles), validate(gradeValidations.createGrade), gradeController.createGradeHandler)
  .get(validate(gradeValidations.getGrades), gradeController.getGradesHandler); // Publicly accessible or add auth as needed

router
  .route('/:gradeId')
  .get(validate(gradeValidations.getGrade), gradeController.getGradeHandler) // Publicly accessible or add auth as needed
  .patch(auth(gradeManagementRoles), validate(gradeValidations.updateGrade), gradeController.updateGradeHandler)
  .delete(auth(gradeManagementRoles), validate(gradeValidations.deleteGrade), gradeController.deleteGradeHandler);

// Routes for managing sections within a grade
router
  .route('/:gradeId/sections')
  .post(auth(gradeManagementRoles), validate(gradeValidations.manageSection), gradeController.addSectionHandler) // To add a single section
  .put(auth(gradeManagementRoles), validate(gradeValidations.manageSectionsArray), gradeController.updateSectionsHandler); // To replace all sections

router
  .route('/:gradeId/sections/:sectionName')
  .delete(auth(gradeManagementRoles), validate(gradeValidations.removeSectionParams), gradeController.removeSectionHandler); // To remove a single section by its name

module.exports = router;
