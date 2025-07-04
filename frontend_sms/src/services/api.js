import axios from 'axios';
import useAuthStore from '../store/auth.store'; // To get the token

// Determine API base URL from environment variables or default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'; // Adjust if your backend runs elsewhere

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (optional, for global error handling or token refresh logic)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized access or token expired
      // Attempt to logout user from store
      // Check if it's not a login attempt that failed
      if (error.config.url !== '/auth/login') { // Adjust login URL if different
        const { logout } = useAuthStore.getState();
        logout();
        // Optionally redirect to login page
        // window.location.href = '/login'; // Or use React Router navigation
        console.error('Unauthorized access or token expired. User logged out.');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
