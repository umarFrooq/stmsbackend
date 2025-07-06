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


const classScheduleService = {
  getClassScheduleById,
  getTeacherClassSchedules,
  // createClassSchedule, // Uncomment if/when implemented
  // updateClassSchedule, // Uncomment if/when implemented
  // deleteClassSchedule, // Uncomment if/when implemented
};

export default classScheduleService;
