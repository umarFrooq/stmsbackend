const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware');
const assignmentValidation = require('./assignment.validations');
const assignmentController = require('./assignment.controller');
const { assignmentSpecificSubmissionRouter } = require('./submission.routes');

const router = express.Router();

// Permissions
const MANAGE_ASSIGNMENTS = 'manageAssignments';
const GET_ASSIGNMENTS = 'getAssignments';

router.use(auth(), schoolScopeMiddleware);

router
  .route('/')
  .post(
    auth(MANAGE_ASSIGNMENTS),
    validate(assignmentValidation.createAssignment),
    assignmentController.createAssignmentHandler
  )
  .get(
    auth(GET_ASSIGNMENTS),
    validate(assignmentValidation.getAssignments),
    assignmentController.getAssignmentsHandler
  );

router
  .route('/:assignmentId')
  .get(
    auth(GET_ASSIGNMENTS),
    validate(assignmentValidation.getAssignment),
    assignmentController.getAssignmentHandler
  )
  .patch(
    auth(MANAGE_ASSIGNMENTS),
    validate(assignmentValidation.updateAssignment),
    assignmentController.updateAssignmentHandler
  )
  .delete(
    auth(MANAGE_ASSIGNMENTS),
    validate(assignmentValidation.deleteAssignment),
    assignmentController.deleteAssignmentHandler
  );

// Nest submission routes under /:assignmentId/submissions
router.use('/:assignmentId/submissions', assignmentSpecificSubmissionRouter);

module.exports = router;
