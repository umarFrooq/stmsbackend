import apiClient from './api';

// The backend URL for fetching all users as specified in the task description
const GET_ALL_USERS_V2_URL = `${import.meta.env.VITE_API_HOST || 'http://localhost:3000'}/v2/users/admin`;

/**
 * Fetches all users with optional filters, search, and pagination.
 * Calls the backend API directly to ensure fresh data.
 * @param {object} params - Query parameters for filtering, searching, and pagination.
 *                          Example: { limit: 10, page: 1, role: 'admin', name: 'fullname', value: 'John' }
 * @returns {Promise<object>} The response data from the API.
 */
export const getAllUsers = async (params) => {
  try {
    // For this specific v2 endpoint, we use the full URL directly with apiClient
    // as its baseURL might be configured for v1.
    // apiClient will still add headers like Authorization.
    const response = await apiClient.get(GET_ALL_USERS_V2_URL, { params });
    return response.data; // Assuming the backend returns data in the format { data: { results: [], ... } }
  } catch (error) {
    console.error('Error fetching all users:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error fetching users');
  }
};

/**
 * Adds a new user.
 * Calls the backend API directly to ensure fresh data.
 * @param {object} userData - The user data for creating the new user.
 *                           Example: { fullname: 'Test User', email: 'test@example.com', password: 'password123', role: 'admin' }
 * @returns {Promise<object>} The response data from the API (typically the created user).
 */
export const addUser = async (userData) => {
  try {
    // This will be prefixed with apiClient's baseURL (e.g., http://localhost:3000/api/v1)
    // The backend route is POST /users
    const response = await apiClient.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error adding user:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error adding user');
  }
};

/**
 * Updates an existing user.
 * Calls the backend API directly to ensure fresh data.
 * @param {string} userId - The ID of the user to update.
 * @param {object} userData - The user data to update.
 *                            Example: { fullname: 'Updated Name' }
 * @returns {Promise<object>} The response data from the API (typically the updated user).
 */
export const updateUser = async (userId, userData) => {
  if (!userId) {
    throw new Error('User ID is required for updating.');
  }
  try {
    // This will be prefixed with apiClient's baseURL
    // The backend route is PATCH /users/:userId
    const response = await apiClient.patch(`http://localhost:3000/v1/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error updating user');
  }
};

/**
 * Deletes a user.
 * Calls the backend API directly.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<object>} The response data from the API.
 */
export const deleteUser = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required for deletion.');
  }
  try {
    // This will be prefixed with apiClient's baseURL
    // The backend route is DELETE /users/:userId
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data; // Or handle based on what your backend returns (e.g., status 204 No Content)
  } catch (error) {
    console.error('Error deleting user:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error deleting user');
  }
};

export default {
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
};
