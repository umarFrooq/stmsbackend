import apiClient from './api'; // Assuming apiClient is set up in api.js

const ASSIGNMENTS_BASE_URL = '/assignments';

/**
 * Creates a new assignment.
 * @param {object} assignmentData - Data for the new assignment.
 * Expected format: { title, description?, subjectId, gradeId, branchId, dueDate, totalMarks, allowLateSubmission?, lateSubmissionPenaltyPercentage?, fileAttachments?, status?, schoolId? (if rootUser) }
 * @returns {Promise<object>} The created assignment object.
 */
export const createAssignment = async (assignmentData) => {
  try {
    const response = await apiClient.post(ASSIGNMENTS_BASE_URL, assignmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating assignment:', error.response ? error.response.data : error.message);
    throw error.response?.data || { message: 'Error creating assignment', error };
  }
};

/**
 * Fetches assignments with optional filters and pagination.
 * @param {object} params - Query parameters.
 * Example: { limit, page, sortBy, title, subjectId, gradeId, branchId, teacherId, dueDateFrom, dueDateTo, status, schoolId }
 * @returns {Promise<object>} Paginated list of assignments.
 */
export const getAssignments = async (params = {}) => {
  try {
    // Manually build the query string
    const queryString = Object.keys(params)
      .map(key => {
        const value = params[key];
        if (value) {
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
        return null;
      })
      .filter(Boolean)
      .join('&');

    const url = `${ASSIGNMENTS_BASE_URL}?${queryString}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching assignments:', error.response ? error.response.data : error.message);
    throw error.response?.data || { message: 'Error fetching assignments', error };
  }
};

/**
 * Fetches a single assignment by its ID.
 * @param {string} assignmentId - The ID of the assignment.
 * @param {object} params - Optional query parameters, e.g., { populate: 'subjectId,gradeId' }
 * @returns {Promise<object>} The assignment object.
 */
export const getAssignmentById = async (assignmentId, params = {}) => {
  try {
    if (!assignmentId) throw new Error('Assignment ID is required.');
    const response = await apiClient.get(`${ASSIGNMENTS_BASE_URL}/${assignmentId}`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching assignment ${assignmentId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: `Error fetching assignment ${assignmentId}`, error };
  }
};

/**
 * Updates an existing assignment.
 * @param {string} assignmentId - The ID of the assignment to update.
 * @param {object} updateData - Data to update.
 * @returns {Promise<object>} The updated assignment object.
 */
export const updateAssignment = async (assignmentId, updateData) => {
  try {
    if (!assignmentId) throw new Error('Assignment ID is required for updating.');
    const response = await apiClient.patch(`${ASSIGNMENTS_BASE_URL}/${assignmentId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating assignment ${assignmentId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: `Error updating assignment ${assignmentId}`, error };
  }
};

/**
 * Deletes an assignment by its ID.
 * @param {string} assignmentId - The ID of the assignment to delete.
 * @returns {Promise<void>}
 */
export const deleteAssignment = async (assignmentId) => {
  try {
    if (!assignmentId) throw new Error('Assignment ID is required for deletion.');
    await apiClient.delete(`${ASSIGNMENTS_BASE_URL}/${assignmentId}`);
  } catch (error) {
    console.error(`Error deleting assignment ${assignmentId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: `Error deleting assignment ${assignmentId}`, error };
  }
};

export default {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};
