import apiClient from './api';

/**
 * Fetches all branches from the backend.
 * Attempts to fetch all branches by requesting a large limit.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of branch objects.
 *                                    Each branch object is expected to have at least 'id' and 'name'.
 *                                    Returns an empty array in case of error or if data is not in expected format.
 */
export const getAllBranches = async () => {
  try {
    // The backend API is paginated. Request a large limit to get all/most branches.
    // A more robust solution for APIs that don't support limit=-1 or similar
    // would involve checking totalPages and fetching page by page if necessary.
    const params = {
      limit: 200, // Assuming 200 is enough to cover all branches. Adjust if needed.
      page: 1,
    };
    // apiClient is likely configured for /api/v1, so this calls GET /api/v1/branches
    const response = await apiClient.get('/branches', { params });

    // Based on the provided response structure: { results: [], ... }
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    } else {
      console.error('Error fetching branches: Data format is not as expected.', response.data);
      return []; // Return empty array on unexpected format
    }
  } catch (error) {
    console.error('Error fetching branches:', error.response ? error.response.data : error.message);
    // Rethrow or return empty array based on how you want to handle errors in the calling component
    throw error; // Or return [];
  }
};

export default {
  getAllBranches,
};
