import api from './api';

const leavePolicyService = {
  createLeavePolicy: (data) => api.post('/leave-policies', data),
  getLeavePolicy: (branchId) => api.get(`/leave-policies/${branchId}`),
  updateLeavePolicy: (branchId, data) => api.patch(`/leave-policies/${branchId}`, data),
};

export default leavePolicyService;
