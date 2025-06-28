import apiClient from './api';
import useAuthStore from '../store/auth.store';

const login = async (credentials) => {
  try {
    // Replace '/auth/login' with your actual backend login endpoint
    const response = await apiClient.post('/auth/login', credentials);

    if (response.data && response.data.token) {
      const { token, user, roles, permissions } = response.data;
      // Assuming backend returns token, user object, array of roles, and array of permissions
      // Adjust according to your actual backend response structure

      // Use the login action from the store
      useAuthStore.getState().login(token, user, roles, permissions);
      return { success: true, user, roles, permissions };
    } else {
      // Handle cases where token is not in the response
      throw new Error(response.data.message || 'Login failed: No token received');
    }
  } catch (error) {
    console.error('Login error:', error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred during login.';
    return { success: false, error: errorMessage };
  }
};

const logout = () => {
  // Perform any backend logout if necessary (e.g., invalidating token on server-side)
  // For this example, we primarily clear client-side state.
  // await apiClient.post('/auth/logout'); // Example if you have a backend logout

  useAuthStore.getState().logout();
};

// Example: Fetch current user profile if you need to re-validate or get fresh data
const fetchUserProfile = async () => {
  try {
    // Replace '/users/me' or '/auth/profile' with your actual endpoint
    const response = await apiClient.get('/users/me');
    if (response.data) {
      const { user, roles, permissions } = response.data; // Adjust to your backend response
      // Update store if needed, though login usually populates this.
      // This could be used if you only store token and fetch user details on app load.
      // For now, our auth.store persists user, roles, permissions.
      // useAuthStore.getState().updateUserProfile(user, roles, permissions); // You'd need to add this action to store
      return { success: true, user, roles, permissions };
    }
    return { success: false, error: 'Failed to fetch user profile' };
  } catch (error) {
    console.error('Fetch user profile error:', error.response ? error.response.data : error.message);
    // If 401, interceptor should handle logout
    return { success: false, error: error.response?.data?.message || error.message };
  }
};


const authService = {
  login,
  logout,
  fetchUserProfile,
  // register, // Add if you have registration
  // forgotPassword,
  // resetPassword,
};

export default authService;
