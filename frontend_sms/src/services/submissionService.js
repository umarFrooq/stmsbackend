import apiClient from './api'; // Assuming apiClient is set up in api.js

const SUBMISSIONS_BASE_URL = '/submissions';
const ASSIGNMENTS_BASE_URL = '/assignments';

/**
 * Creates a new submission for an assignment.
 * @param {string} assignmentId - The ID of the assignment.
 * @param {object} submissionData - Data for the submission.
 * Expected format: { submittedFiles: [{ fileName, filePath, fileType }], studentRemarks? }
 * @returns {Promise<object>} The created submission object.
 */
export const createSubmission = async (assignmentId, submissionData) => {
  try {
    if (!assignmentId) throw new Error('Assignment ID is required for submission.');
    const response = await apiClient.post(`${ASSIGNMENTS_BASE_URL}/${assignmentId}${SUBMISSIONS_BASE_URL}`, submissionData);
    return response.data;
  } catch (error) {
    console.error(`Error creating submission for assignment ${assignmentId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: `Error creating submission for assignment ${assignmentId}`, error };
  }
};

/**
 * Fetches submissions with optional filters and pagination.
 * This can be used to fetch all submissions for a specific assignment,
 * all submissions by a specific student, or other filtered views based on role.
 * @param {object} params - Query parameters.
 * Example: { limit, page, sortBy, assignmentId, studentId, status, schoolId, gradeId }
 * @returns {Promise<object>} Paginated list of submissions.
 */
export const getSubmissions = async (params = {}) => {
  try {
    // If fetching submissions for a specific assignment, the route might be nested or use a query param.
    // The backend routes are:
    // GET /assignments/:assignmentId/submissions
    // GET /submissions (with filters like studentId)
    // This service function will use the general /submissions endpoint with query parameters.
    // The controller on the frontend will decide if it needs to pass assignmentId in params.
    const response = await apiClient.get(SUBMISSIONS_BASE_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching submissions:', error.response ? error.response.data : error.message);
    throw error.response?.data || { message: 'Error fetching submissions', error };
  }
};


/**
 * Fetches all submissions for a specific assignment.
 * @param {string} assignmentId - The ID of the assignment.
 * @param {object} params - Optional query parameters (e.g., limit, page, sortBy, status).
 * @returns {Promise<object>} Paginated list of submissions for the assignment.
 */
export const getSubmissionsForAssignment = async (assignmentId, params = {}) => {
  try {
    if (!assignmentId) throw new Error('Assignment ID is required.');
    const response = await apiClient.get(`${ASSIGNMENTS_BASE_URL}/${assignmentId}${SUBMISSIONS_BASE_URL}`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching submissions for assignment ${assignmentId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: `Error fetching submissions for assignment ${assignmentId}`, error };
  }
};


/**
 * Fetches a single submission by its ID.
 * @param {string} submissionId - The ID of the submission.
 * @param {object} params - Optional query parameters, e.g., { populate: 'studentId,assignmentId' }
 * @returns {Promise<object>} The submission object.
 */
export const getSubmissionById = async (submissionId, params = {}) => {
  try {
    if (!submissionId) throw new Error('Submission ID is required.');
    const response = await apiClient.get(`${SUBMISSIONS_BASE_URL}/${submissionId}`, { params });
    return response.data;
  } catch (error)
 {
    console.error(`Error fetching submission ${submissionId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: `Error fetching submission ${submissionId}`, error };
  }
};

/**
 * Grades a submission.
 * @param {string} submissionId - The ID of the submission to grade.
 * @param {object} gradeData - Data for grading.
 * Expected format: { obtainedMarks, teacherRemarks? }
 * @returns {Promise<object>} The updated (graded) submission object.
 */
export const gradeSubmission = async (submissionId, gradeData) => {
  try {
    if (!submissionId) throw new Error('Submission ID is required for grading.');
    const response = await apiClient.patch(`${SUBMISSIONS_BASE_URL}/${submissionId}/grade`, gradeData);
    return response.data;
  } catch (error) {
    console.error(`Error grading submission ${submissionId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: `Error grading submission ${submissionId}`, error };
  }
};

export default {
  createSubmission,
  getSubmissions,
  getSubmissionsForAssignment,
  getSubmissionById,
  gradeSubmission,
};
