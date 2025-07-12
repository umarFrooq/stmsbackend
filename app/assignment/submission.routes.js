const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schoolScopeMiddleware = require('../middlewares/schoolScope.middleware');
const submissionValidation = require('./submission.validations');
const submissionController = require('./submission.controller');

const router = express.Router(); // Main router for /submissions
const assignmentSubmissionsRouter = express.Router({ mergeParams: true }); // Router for /assignments/:assignmentId/submissions

// Permissions (these should be defined in your RBAC system)
const SUBMIT_ASSIGNMENT = 'submitAssignment'; // For students
const VIEW_OWN_SUBMISSIONS = 'viewOwnSubmissions'; // For students
const VIEW_ASSIGNMENT_SUBMISSIONS = 'viewAssignmentSubmissions'; // For teachers/admins to see all submissions for an assignment
const GRADE_SUBMISSION = 'gradeSubmission'; // For teachers/admins
const VIEW_ALL_SUBMISSIONS_SCHOOL = 'viewAllSubmissionsSchool'; // For admins to view any submission in school
const VIEW_ALL_SUBMISSIONS_ROOT = 'viewAllSubmissionsRoot'; // For rootUser

// Apply auth and schoolScope middleware.
// Note: schoolScope might not be directly relevant for a student submitting to a specific assignmentId,
// as the assignmentId itself implies the school. But it's good for general listing by admins.
router.use(auth(), schoolScopeMiddleware);
assignmentSubmissionsRouter.use(auth(), schoolScopeMiddleware);


// Route: POST /assignments/:assignmentId/submissions
// Student submits work for a specific assignment.
assignmentSubmissionsRouter.post(
  '/', // Path relative to assignmentSubmissionsRouter ('/:assignmentId/submissions/')
  auth(SUBMIT_ASSIGNMENT),
  validate(submissionValidation.createSubmission), // Validation uses :assignmentId from params
  submissionController.createSubmissionHandler
);

// Route: GET /assignments/:assignmentId/submissions
// Teacher/Admin views all submissions for a specific assignment.
assignmentSubmissionsRouter.get(
  '/',
  auth(VIEW_ASSIGNMENT_SUBMISSIONS, VIEW_ALL_SUBMISSIONS_SCHOOL, VIEW_ALL_SUBMISSIONS_ROOT),
  validate(submissionValidation.getSubmissions), // Validation uses :assignmentId from params in query
  submissionController.getSubmissionsHandler // Controller will pick assignmentId from params if needed for service
);


// General routes for /submissions (not nested under assignments)

// Route: GET /submissions
// Used by:
// - Students to get their own submissions (filtered by service using user._id).
// - Admins/Teachers to query submissions with filters (e.g., by studentId, status, schoolId, gradeId).
router.get(
    '/',
    auth(VIEW_OWN_SUBMISSIONS, VIEW_ASSIGNMENT_SUBMISSIONS, VIEW_ALL_SUBMISSIONS_SCHOOL, VIEW_ALL_SUBMISSIONS_ROOT), // Various roles can access this
    validate(submissionValidation.getSubmissions),
    submissionController.getSubmissionsHandler
);

// Route: GET /submissions/:submissionId
// Student views their own specific submission.
// Teacher/Admin views a specific submission.
router
    .route('/:submissionId')
    .get(
        auth(VIEW_OWN_SUBMISSIONS, VIEW_ASSIGNMENT_SUBMISSIONS, VIEW_ALL_SUBMISSIONS_SCHOOL, VIEW_ALL_SUBMISSIONS_ROOT),
        validate(submissionValidation.getSubmission),
        submissionController.getSubmissionHandler
    )
    .patch(
        auth(GRADE_SUBMISSION, VIEW_ALL_SUBMISSIONS_ROOT),
        validate(submissionValidation.updateSubmission),
        submissionController.updateSubmissionHandler
    );

// Route: PATCH /submissions/:submissionId/grade
// Teacher/Admin grades a specific submission.
router.patch(
    '/:submissionId/grade',
    auth(GRADE_SUBMISSION, VIEW_ALL_SUBMISSIONS_ROOT), // VIEW_ALL_SUBMISSIONS_SCHOOL might also imply grading rights for admin
    validate(submissionValidation.gradeSubmission),
    submissionController.gradeSubmissionHandler
);


module.exports = {
    mainSubmissionRouter: router, // To be mounted at /submissions
    assignmentSpecificSubmissionRouter: assignmentSubmissionsRouter // To be mounted at /assignments
};
