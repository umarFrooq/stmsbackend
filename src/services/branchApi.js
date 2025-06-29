import axios from 'axios';

const API_BASE_URL = '/api'; // Adjust if your API is hosted elsewhere or has a different prefix

// Function to get the auth token (replace with your actual implementation)
const getAuthToken = () => {
  // Example: retrieve it from localStorage, a cookie, or a state management store
  return localStorage.getItem('authToken');
};

// Create an axios instance with default headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const getBranches = async (params) => {
  // params could be { sortBy, limit, page, name, branchCode }
  try {
    const response = await apiClient.get('/branches', { params });
    return response.data; // Assuming backend returns data in the format { results: [], page, limit, totalPages, totalResults } or similar
  } catch (error) {
    console.error('Error fetching branches:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch branches');
  }
};

const getBranchById = async (branchId) => {
  try {
    const response = await apiClient.get(`/branches/${branchId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching branch ${branchId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error(`Failed to fetch branch ${branchId}`);
  }
};

const createBranch = async (branchData) => {
  try {
    const response = await apiClient.post('/branches', branchData);
    return response.data;
  } catch (error) {
    console.error('Error creating branch:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to create branch');
  }
};

const updateBranch = async (branchId, branchData) => {
  try {
    const response = await apiClient.patch(`/branches/${branchId}`, branchData);
    return response.data;
  } catch (error) {
    console.error(`Error updating branch ${branchId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error(`Failed to update branch ${branchId}`);
  }
};

const deleteBranch = async (branchId) => {
  try {
    const response = await apiClient.delete(`/branches/${branchId}`);
    return response.data; // Or just a success status
  } catch (error) {
    console.error(`Error deleting branch ${branchId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error(`Failed to delete branch ${branchId}`);
  }
};

export {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getAuthToken // Exporting this for potential use in login/logout logic elsewhere
};
