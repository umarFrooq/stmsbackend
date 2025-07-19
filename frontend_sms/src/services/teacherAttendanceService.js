import api from './api';

const teacherAttendanceService = {
  markTeacherAttendance: (data) => api.post('/teacher-attendances', data),
  getTeacherAttendances: (params) => api.get('/teacher-attendances', { params }),
  getTeacherAttendance: (id) => api.get(`/teacher-attendances/${id}`),
  updateTeacherAttendance: (id, data) => api.patch(`/teacher-attendances/${id}`, data),
  deleteTeacherAttendance: (id) => api.delete(`/teacher-attendances/${id}`),
};

export default teacherAttendanceService;
