import apiClient from './api';

const API_ENDPOINT = '/subjects'; // Base endpoint for subjects

/**
 * Creates a new subject.
 * @param {object} subjectData - Data for the new subject.
 * Expected: { title, subjectCode?, description?, creditHours, branchId, defaultTeacher?, schoolId? (for rootUser) }
 * @returns {Promise<object>} The created subject object.
 */
export const createSubject = async (subjectData) => {
  try {
    const response = await apiClient.post(API_ENDPOINT, subjectData);
    return response.data;
  } catch (error) {
    console.error('Error creating subject:', error.response ? error.response.data : error.message);
    throw error.response?.data || { message: error.message || 'Failed to create subject.' };
  }
};

/**
 * Fetches subjects with optional filters, search, pagination, and sorting.
 * @param {object} params - Query parameters.
 * Example: { page: 1, limit: 10, sortBy: 'title:asc', search: 'Math', branchId: '...', schoolId: '...' (for rootUser) }
 * @returns {Promise<object>} Paginated list of subjects. { results: [], totalResults, ... }
 */
export const getSubjects = async (params = {}) => {
  try {
    const response = await apiClient.get(API_ENDPOINT, { params });
    // Expecting backend to return paginated structure: { results: [], totalResults, page, limit, totalPages }
    if (response.data && Array.isArray(response.data.results)) {
      return response.data;
    } else {
      console.error('Error fetching subjects: Data format is not as expected.', response.data);
      return { results: [], page: 1, limit: params.limit || 10, totalPages: 0, totalResults: 0 };
    }
  } catch (error) {
    console.error('Error fetching subjects:', error.response ? error.response.data : error.message);
    throw error.response?.data || { message: error.message || 'Failed to fetch subjects.' };
  }
};

/**
 * Fetches a single subject by its ID.
 * @param {string} subjectId - The ID of the subject.
 * @param {object} params - Optional query parameters, e.g., { populate: 'branchId,defaultTeacher', schoolId: '...' (for rootUser) }
 * @returns {Promise<object>} The subject object.
 */
export const getSubjectById = async (subjectId, params = {}) => {
  try {
    if (!subjectId) throw new Error('Subject ID is required.');
    const response = await apiClient.get(`${API_ENDPOINT}/${subjectId}`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching subject ${subjectId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: error.message || `Failed to fetch subject ${subjectId}.` };
  }
};

/**
 * Updates an existing subject.
 * @param {string} subjectId - The ID of the subject to update.
 * @param {object} updateData - Data to update.
 * Expected: { title?, subjectCode?, description?, creditHours?, branchId?, defaultTeacher?, schoolIdToScopeTo? (for rootUser) }
 * @returns {Promise<object>} The updated subject object.
 */
export const updateSubject = async (subjectId, updateData) => {
  try {
    if (!subjectId) throw new Error('Subject ID is required for updating.');
    const response = await apiClient.patch(`${API_ENDPOINT}/${subjectId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating subject ${subjectId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: error.message || `Failed to update subject ${subjectId}.` };
  }
};

/**
 * Deletes a subject by its ID.
 * @param {string} subjectId - The ID of the subject to delete.
 * @param {object} params - Optional query parameters, e.g., { schoolIdToScopeTo: '...' (for rootUser) }
 * @returns {Promise<void>}
 */
export const deleteSubject = async (subjectId, params = {}) => {
  try {
    if (!subjectId) throw new Error('Subject ID is required for deletion.');
    await apiClient.delete(`${API_ENDPOINT}/${subjectId}`, { params });
  } catch (error) {
    console.error(`Error deleting subject ${subjectId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: error.message || `Failed to delete subject ${subjectId}.` };
  }
};

const subjectService = {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};

export default subjectService;
