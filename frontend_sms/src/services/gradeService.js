import apiClient from './api';

/**
 * Creates a new grade.
 * @param {object} gradeData - Data for the new grade.
 * Expected format: { title, levelCode?, description?, branchId, sections?, nextGradeId?, schoolIdForGrade? (if rootUser) }
 * @returns {Promise<object>} The created grade object.
 */
 const createGrade = async (gradeData) => {
  try {
    // The schoolId for the grade might be implicitly handled by the backend via user context (for non-root users)
    // or explicitly passed in gradeData.schoolIdForGrade (for root users, as per backend grade.controller.js)
    const response = await apiClient.post('/grades', gradeData);
    return response.data;
  } catch (error) {
    console.error('Error creating grade:', error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('Error creating grade');
  }
};

/**
 * Fetches grades with optional filters and pagination.
 * @param {object} params - Query parameters.
 * Example: { limit: 10, page: 1, sortBy: 'title:asc', title: 'Grade 1', branchId: 'someBranchId', schoolId: 'someSchoolId' (if rootUser or specific filter) }
 * @returns {Promise<object>} Paginated list of grades. { results: [], totalResults, totalPages, page, limit }
 */
 export const getGrades = async (params = {}) => {
  try {
    // For non-root users, schoolId is added by schoolScopeMiddleware or derived from user token on backend.
    // Root users might need to pass schoolId in params if they want to scope the request.
    const response = await apiClient.get('/grades', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching grades:', error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('Error fetching grades');
  }
};

/**
 * Fetches a single grade by its ID.
 * @param {string} gradeId - The ID of the grade.
 * @param {object} params - Optional query parameters, e.g., { populate: 'branchId,nextGradeId', schoolId: 'someSchoolId' (if rootUser) }
 * @returns {Promise<object>} The grade object.
 */
 const getGradeById = async (gradeId, params = {}) => {
  try {
    if (!gradeId) throw new Error('Grade ID is required.');
    // schoolId for scoping by rootUser can be passed in params.
    const response = await apiClient.get(`/grades/${gradeId}`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching grade ${gradeId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || new Error(`Error fetching grade ${gradeId}`);
  }
};

/**
 * Updates an existing grade.
 * @param {string} gradeId - The ID of the grade to update.
 * @param {object} updateData - Data to update.
 * Example: { title: "New Title", schoolIdToScopeTo? (if rootUser) }
 * @returns {Promise<object>} The updated grade object.
 */
 const updateGrade = async (gradeId, updateData) => {
  try {
    if (!gradeId) throw new Error('Grade ID is required for updating.');
    // schoolIdToScopeTo for rootUser should be in updateData if they need to specify the school scope for update.
    const response = await apiClient.patch(`/grades/${gradeId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating grade ${gradeId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || new Error(`Error updating grade ${gradeId}`);
  }
};

/**
 * Deletes a grade by its ID.
 * @param {string} gradeId - The ID of the grade to delete.
 * @param {object} params - Optional query parameters, e.g., { schoolIdToScopeTo: 'someSchoolId' (if rootUser) }
 * @returns {Promise<void>}
 */
 const deleteGrade = async (gradeId, params = {}) => {
  try {
    if (!gradeId) throw new Error('Grade ID is required for deletion.');
    // schoolIdToScopeTo for rootUser can be passed in params.
    await apiClient.delete(`/grades/${gradeId}`, { params });
  } catch (error) {
    console.error(`Error deleting grade ${gradeId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || new Error(`Error deleting grade ${gradeId}`);
  }
};

// TODO: Add functions for section management if needed directly, e.g.,
// addSectionToGrade, removeSectionFromGrade, updateSectionsInGrade.
// For now, assuming sections are managed as part of the grade create/update.

export default {
  createGrade,
  // getGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
};
