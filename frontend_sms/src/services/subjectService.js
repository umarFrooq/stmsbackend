import apiClient from './api';

const API_ROUTE = '/subjects'; // Base route for subjects

const subjectService = {
  /**
   * Get all subjects with optional query parameters for filtering and pagination
   * @param {object} params - Query parameters (e.g., { limit, page, sortBy, title, gradeId, defaultTeacher, creditHours, branchId })
   * @returns {Promise<object>} - Paginated list of subjects
   */
  getSubjects: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ROUTE, { params });
      return response.data; // Assuming backend returns data in { results: [], page, limit, totalPages, totalResults } format
    } catch (error) {
      console.error('Error fetching subjects:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to fetch subjects');
    }
  },

  /**
   * Get a single subject by its ID
   * @param {string} subjectId - The ID of the subject
   * @returns {Promise<object>} - The subject object
   */
  getSubjectById: async (subjectId) => {
    try {
      const response = await apiClient.get(`${API_ROUTE}/${subjectId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching subject ${subjectId}:`, error.response?.data || error.message);
      throw error.response?.data || new Error(`Failed to fetch subject ${subjectId}`);
    }
  },

  /**
   * Create a new subject
   * @param {object} subjectData - Data for the new subject (title, subjectCode, description, creditHours, branchId, defaultTeacher, gradeId)
   * @returns {Promise<object>} - The created subject object
   */
  createSubject: async (subjectData) => {
    try {
      const response = await apiClient.post(API_ROUTE, subjectData);
      return response.data;
    } catch (error) {
      console.error('Error creating subject:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to create subject');
    }
  },

  /**
   * Update an existing subject
   * @param {string} subjectId - The ID of the subject to update
   * @param {object} subjectData - Data to update
   * @returns {Promise<object>} - The updated subject object
   */
  updateSubject: async (subjectId, subjectData) => {
    try {
      const response = await apiClient.patch(`${API_ROUTE}/${subjectId}`, subjectData);
      return response.data;
    } catch (error) {
      console.error(`Error updating subject ${subjectId}:`, error.response?.data || error.message);
      throw error.response?.data || new Error(`Failed to update subject ${subjectId}`);
    }
  },

  /**
   * Delete a subject
   * @param {string} subjectId - The ID of the subject to delete
   * @returns {Promise<void>}
   */
  deleteSubject: async (subjectId) => {
    try {
      await apiClient.delete(`${API_ROUTE}/${subjectId}`);
    } catch (error) {
      console.error(`Error deleting subject ${subjectId}:`, error.response?.data || error.message);
      throw error.response?.data || new Error(`Failed to delete subject ${subjectId}`);
    }
  },
};

export default subjectService;
