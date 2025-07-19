import api from '../api';

const leavePolicyService = {
  createLeavePolicy: (data) => api.post('/leave-policies', data),
  getLeavePolicies: (params) => api.get('/leave-policies', { params }),
  getLeavePolicy: (id) => api.get(`/leave-policies/${id}`),
  updateLeavePolicy: (id, data) => api.patch(`/leave-policies/${id}`, data),
  deleteLeavePolicy: (id) => api.delete(`/leave-policies/${id}`),
};

export default leavePolicyService;
