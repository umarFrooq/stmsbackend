import apiClient from './api';

/**
 * Fetches branches from the backend with optional filters, search, pagination, and sorting.
 * @param {object} queryParams - Optional query parameters.
 * Example: { page: 1, limit: 10, sortBy: 'name:asc', search: 'Main', status: 'active', type: 'main', schoolId: '...' }
 * @returns {Promise<object>} A promise that resolves to the API response (expected to be paginated: { results: [], ... }).
 */
export const getAllBranches = async (queryParams = {}) => {
  try {
    // apiClient is likely cousenfigured for /api/v1, so this calls GET /v1/branches
    // The backend now supports 'search', 'status', 'type', 'schoolId' etc.
    const response = await apiClient.get('/branches', { params: queryParams }); // Using /v1 implicitly from apiClient base URL

    // Expecting backend to return paginated structure: { results: [], totalResults, page, limit, totalPages }
    if (response.data && Array.isArray(response.data.results)) {
      return response.data;
    } else {
      console.error('Error fetching branches: Data format is not as expected.', response.data);
      // Return a default paginated structure on format error to prevent crashes in UI
      return { results: [], page: 1, limit: queryParams.limit || 10, totalPages: 0, totalResults: 0 };
    }
  } catch (error) {
    console.error('Error fetching branches:', error.response ? error.response.data : error.message);
    // Rethrow or return a default paginated structure
    throw error.response?.data || new Error('Error fetching branches');
  }
};

// TODO: Add other branch service functions if needed (create, update, delete, getById)
// For now, focusing on the query function for the list page.

export default {
  getAllBranches, // Renamed from getAllBranches
  // Potentially export other functions here if they were defined e.g.
  // createBranch, updateBranch, deleteBranch, getBranchById
};
