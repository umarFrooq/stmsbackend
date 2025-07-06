import apiClient from './api';

const API_BASE_URL = '/class-schedules'; // Base URL for class schedules API

/**
 * Fetches the details of a specific class schedule by its ID.
 * Expected to return an object containing subjectId, gradeId, section, branchId, schoolId,
 * and potentially populated names like subjectName, gradeName if requested via populate.
 *
 * @param {string} scheduleId - The ID of the class schedule.
 * @param {string} [populate] - Optional comma-separated string of fields to populate (e.g., "subjectId,gradeId,teacherId").
 * @returns {Promise<object>} The class schedule details.
 */
const getClassScheduleById = async (scheduleId, populate = '') => {
  if (!scheduleId) {
    throw new Error('Class Schedule ID is required to fetch schedule details.');
  }
  try {
    const params = {};
    if (populate) {
      params.populate = populate;
    }
    const response = await apiClient.get(`${API_BASE_URL}/${scheduleId}`, { params });
    // Assuming the backend returns data in a structure like { success: true, data: {...}, message: "..." }
    // And the actual schedule object is in response.data.data
    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch class schedule details due to server response.');
    }
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || `Failed to fetch class schedule details for ID ${scheduleId}.`;
    console.error(`Error fetching class schedule details for ID ${scheduleId}:`, errMsg);
    throw new Error(errMsg);
  }
};

/**
 * Fetches a paginated list of class schedules with optional filters.
 * Primarily for admins to view schedules.
 * @param {object} params - Query parameters (e.g., limit, page, sortBy, schoolId, branchId, gradeId, teacherId, subjectId, dayOfWeek).
 * @returns {Promise<object>} Paginated list of class schedules.
 */
const queryClassSchedules = async (params = {}) => {
  try {
    // For non-root users, schoolId is typically added by schoolScopeMiddleware on backend.
    // Admin users using this would be scoped to their school.
    // Root users might need to pass schoolId in params if they want to scope the request.
    const response = await apiClient.get(API_BASE_URL, { params });
    if (response.data && response.data.success) {
      return response.data.data; // This should be the paginated result object
    } else {
      throw new Error(response.data.message || 'Failed to fetch class schedules due to server response.');
    }
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || 'Failed to query class schedules.';
    console.error('Error querying class schedules:', errMsg);
    throw new Error(errMsg);
  }
};

/**
 * Fetches class schedules for the currently authenticated teacher.
 * Uses the '/my-classes' endpoint.
 * @param {object} params - Optional query parameters (e.g., for pagination, filtering by day).
 *                          `populate` is useful here: e.g. { populate: 'subjectId,gradeId,branchId,schoolId' }
 * @returns {Promise<object>} Paginated list of class schedules for the teacher.
 *                            Expected format from backend: { results: [], totalResults, totalPages, page, limit }
 */
const getTeacherClassSchedules = async (params = {}) => {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/my-classes`, { params });
    // Assuming backend returns data in structure { success: true, data: { results: [...], ... }, message: "..." }
    if (response.data && response.data.success) {
      return response.data.data; // This should be the paginated result object
    } else {
      throw new Error(response.data.message || 'Failed to fetch teacher class schedules due to server response.');
    }
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || 'Failed to fetch teacher class schedules.';
    console.error('Error fetching teacher class schedules:', errMsg);
    throw new Error(errMsg);
  }
};

// Add other class schedule related services here if needed (create, update, delete)
// For example:
// const createClassSchedule = async (scheduleData) => { ... apiClient.post(API_BASE_URL, scheduleData) ... };
// const updateClassSchedule = async (scheduleId, updateData) => { ... apiClient.patch(`${API_BASE_URL}/${scheduleId}`, updateData) ... };
// const deleteClassSchedule = async (scheduleId) => { ... apiClient.delete(`${API_BASE_URL}/${scheduleId}`) ... };

/**
 * Creates a new class schedule.
 * @param {object} scheduleData - The data for the new class schedule.
 * @returns {Promise<object>} The created class schedule object.
 */
const createClassSchedule = async (scheduleData) => {
  try {
    const response = await apiClient.post(API_BASE_URL, scheduleData);
    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to create class schedule due to server response.');
    }
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || 'Failed to create class schedule.';
    console.error('Error creating class schedule:', errMsg);
    throw new Error(errMsg);
  }
};

/**
 * Updates an existing class schedule.
 * @param {string} scheduleId - The ID of the class schedule to update.
 * @param {object} updateData - The data to update the class schedule with.
 * @returns {Promise<object>} The updated class schedule object.
 */
const updateClassSchedule = async (scheduleId, updateData) => {
  if (!scheduleId) {
    throw new Error('Schedule ID is required for update.');
  }
  try {
    const response = await apiClient.patch(`${API_BASE_URL}/${scheduleId}`, updateData);
    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to update class schedule due to server response.');
    }
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || `Failed to update class schedule ${scheduleId}.`;
    console.error('Error updating class schedule:', errMsg);
    throw new Error(errMsg);
  }
};

/**
 * Deletes a class schedule.
 * @param {string} scheduleId - The ID of the class schedule to delete.
 * @returns {Promise<object>} The response data from the server (usually null or a success message).
 */
const deleteClassSchedule = async (scheduleId) => {
  if (!scheduleId) {
    throw new Error('Schedule ID is required for deletion.');
  }
  try {
    const response = await apiClient.delete(`${API_BASE_URL}/${scheduleId}`);
    if (response.data && response.data.success) {
      return response.data; // Contains { success: true, data: null, message: '...' }
    } else {
      throw new Error(response.data.message || 'Failed to delete class schedule due to server response.');
    }
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || `Failed to delete class schedule ${scheduleId}.`;
    console.error('Error deleting class schedule:', errMsg);
    throw new Error(errMsg);
  }
};


const classScheduleService = {
  getClassScheduleById,
  queryClassSchedules, // Added for admin listing
  getTeacherClassSchedules,
  createClassSchedule,
  updateClassSchedule,
  deleteClassSchedule,
};

export default classScheduleService;
