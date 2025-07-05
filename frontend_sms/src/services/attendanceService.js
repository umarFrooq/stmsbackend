import apiClient from './api';

const API_ROUTE = '/attendances'; // Base route for attendance

/**
 * Fetches attendance records with optional filters and pagination.
 * @param {object} params - Query parameters.
 * Example: {
 *   limit: 10,
 *   page: 1,
 *   sortBy: 'date:desc',
 *   studentId: 'someStudentId',
 *   teacherId: 'someTeacherId', // This would map to 'markedBy' on the backend
 *   gradeId: 'someGradeId',
 *   section: 'A',
 *   branchId: 'someBranchId',
 *   subjectId: 'someSubjectId',
 *   date: 'YYYY-MM-DD', // Specific date
 *   startDate: 'YYYY-MM-DD', // Date range start
 *   endDate: 'YYYY-MM-DD', // Date range end
 *   status: 'present',
 *   populate: 'studentId,subjectId,markedBy,gradeId,branchId' // To get names/titles
 * }
 * @returns {Promise<object>} Paginated list of attendance records.
 *                            Expected format: { results: [], totalResults, totalPages, page, limit }
 */
const getAttendances = async (params = {}) => {
  try {
    // Map teacherId from frontend filter to markedBy for backend query
    if (params.teacherId) {
      params.markedBy = params.teacherId;
      delete params.teacherId;
    }

    const response = await apiClient.get(API_ROUTE, { params });
    // Assuming the backend returns data in the format { results: [...], totalResults, ... }
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance records:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch attendance records');
  }
};

// Add other attendance-related functions here if needed in the future, e.g.:
// const getAttendanceById = async (id) => { ... };
// const markAttendance = async (data) => { ... };
// const updateAttendance = async (id, data) => { ... };

const attendanceService = {
  getAttendances,
};

export default attendanceService;
