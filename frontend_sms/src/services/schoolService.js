import apiClient from './api';

const API_ENDPOINT = '/schools'; // Base endpoint for schools

/**
 * Creates a new school and its admin.
 * @param {object} schoolData - The data for the new school.
 *                               Expected format: { nameOfSchool: string, adminEmail: string }
 * @returns {Promise<object>} A promise that resolves to the created school and admin user data.
 */
export const createSchool = async (schoolData) => {
  try {
    const response = await apiClient.post(API_ENDPOINT, schoolData);
    return response.data;
  } catch (error) {
    console.error('Error creating school:', error.response ? error.response.data : error.message);
    throw error.response?.data || { message: error.message || 'Failed to create school.' };
  }
};

/**
 * Fetches a paginated list of schools.
 * @param {object} params - Query parameters for pagination and filtering (e.g., limit, page, sortBy, name).
 * @returns {Promise<object>} A promise that resolves to the paginated list of schools.
 *                            Expected format: { results: [], page: number, limit: number, totalPages: number, totalResults: number }
 */
export const getSchools = async (params = {}) => {
  try {
    const response = await apiClient.get(API_ENDPOINT, { params });
    return response.data; // Backend's paginate function should return this structure
  } catch (error) {
    console.error('Error fetching schools:', error.response ? error.response.data : error.message);
    throw error.response?.data || { message: error.message || 'Failed to fetch schools.' };
  }
};

/**
 * Fetches a single school by its ID.
 * @param {string} schoolId - The ID of the school to fetch.
 * @returns {Promise<object>} A promise that resolves to the school data.
 */
export const getSchoolById = async (schoolId) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINT}/${schoolId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching school ${schoolId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: error.message || `Failed to fetch school ${schoolId}.` };
  }
};

/**
 * Updates an existing school.
 * @param {string} schoolId - The ID of the school to update.
 * @param {object} schoolData - The data to update for the school.
 *                              Expected format: { nameOfSchool?: string } (or other updatable fields)
 * @returns {Promise<object>} A promise that resolves to the updated school data.
 */
export const updateSchool = async (schoolId, schoolData) => {
  try {
    // Ensure payload matches backend expectation if 'nameOfSchool' is used in form
    // and backend expects 'name' for the school model.
    // The controller already handles mapping 'nameOfSchool' to 'name'.
    const response = await apiClient.patch(`${API_ENDPOINT}/${schoolId}`, schoolData);
    return response.data;
  } catch (error) {
    console.error(`Error updating school ${schoolId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: error.message || `Failed to update school ${schoolId}.` };
  }
};

/**
 * Deletes a school by its ID.
 * @param {string} schoolId - The ID of the school to delete.
 * @returns {Promise<void>} A promise that resolves when the school is deleted.
 */
export const deleteSchool = async (schoolId) => {
  try {
    await apiClient.delete(`${API_ENDPOINT}/${schoolId}`);
    // DELETE requests usually return 204 No Content, so no response.data to return
  } catch (error) {
    console.error(`Error deleting school ${schoolId}:`, error.response ? error.response.data : error.message);
    throw error.response?.data || { message: error.message || `Failed to delete school ${schoolId}.` };
  }
};

