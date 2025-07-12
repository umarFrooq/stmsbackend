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

/**
 * Marks attendance for multiple students in bulk.
 * @param {Array<object>} attendanceData - Array of attendance records.
 * Each record: { studentId, schoolId, subjectId, gradeId, section, branchId, date, status, remarks?, markedBy }
 * Note: schoolId might be injected by backend middleware for non-root users,
 * but good practice for frontend to prepare it if known, esp. if a root user is using a school-specific context.
 * The backend controller for bulk expects `schoolIdForAttendance` in body if user is root.
 * For simplicity here, we assume `schoolId` is part of each record if needed, or handled by backend context.
 * @returns {Promise<object>} Response from the server, typically includes arrays for `success` and `errors`.
 * Example: { message: string, success: Array<object>, errors: Array<{entry: object, error: string}> }
 */
const markBulkAttendance = async (attendanceRecords) => {
  try {
    // The request body should be the array of attendance records directly.
    // The backend controller's `req.body` will be this array.
    // If schoolId needs to be passed for a root user context for the whole batch,
    // the API design might need `req.body = { schoolIdForAttendance: '...', records: [] }`
    // However, current backend controller for bulk uses `req.schoolId` (from middleware) or `req.body.schoolIdForAttendance`
    // and then `req.body` for the array of records.
    // The `recordsToSave` in `AttendanceTakingPage` includes schoolId in each record,
    // which is fine for backend service to validate each record.
    const response = await apiClient.post(`${API_ROUTE}/bulk`, attendanceRecords);
    return response.data; // Contains message, success[], errors[]
  } catch (error) {
    console.error('Error marking bulk attendance:', error.response?.data || error.message);
    // Throw the structured error from backend if available, or a generic one
    throw error.response?.data || new Error('Failed to mark bulk attendance');
  }
};


export { getAttendances, markBulkAttendance };
