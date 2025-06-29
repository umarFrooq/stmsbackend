import apiClient from './api';
import useAuthStore from '../store/auth.store';

const login = async (credentials) => {
  try {
    // The actual backend login endpoint is /v1/auth/login
    // apiClient should be configured with the base URL http://localhost:3000
    // So, we'll use '/v1/auth/login' if apiClient doesn't prefix v1,
    // or ensure apiClient is set up for just '/auth/login' if it includes '/v1'
    // For now, assuming apiClient is set to hit http://localhost:3000, so path is /v1/auth/login
    // Based on user's initial description, the full path is 'http://localhost:3000/v1/auth/login'
    // If apiClient.post already includes 'http://localhost:3000', then '/v1/auth/login' is correct.
    // If apiClient.post is relative to 'http://localhost:3000/v1', then '/auth/login' is correct.
    // The original code had '/auth/login'. The user's initial problem description showed 'http://localhost:3000/v1/auth/login'
    // Let's assume the apiClient is configured for the domain and the path should be '/v1/auth/login'.
    // However, the provided file already has '/auth/login'. I will stick to what's in the file for now,
    // as the user's original code snippet might have been from a different version or context.
    // The critical part is the response handling.

    const response = await apiClient.post('/auth/login', credentials); // Using existing path from file

    // Adjusting to the provided API response structure:
    // { "data": { "user": { ... }, "tokens": { "access": { "token": "..." } } }, ... }
    if (response.data && response.data.data && response.data.data.tokens && response.data.data.tokens.access && response.data.data.tokens.access.token) {
      const token = response.data.data.tokens.access.token;
      const user = response.data.data.user;
      const roles = user && user.role ? [user.role] : []; // API has user.role as a string
      const permissions = []; // Permissions are not in the API response

      // Use the login action from the store
      useAuthStore.getState().login(token, user, roles, permissions);
      return { success: true, user, roles, permissions };
    } else {
      // Handle cases where token is not in the response
      const message = response.data && response.data.message ? response.data.message : 'Login failed: No token or invalid response structure';
      throw new Error(message);
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
