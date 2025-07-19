import api from '../api';

const payrollService = {
  createPayroll: (data) => api.post('/payrolls', data),
  getPayrolls: (params) => api.get('/payrolls', { params }),
  getPayroll: (id) => api.get(`/payrolls/${id}`),
  updatePayroll: (id, data) => api.patch(`/payrolls/${id}`, data),
  deletePayroll: (id) => api.delete(`/payrolls/${id}`),
};

export default payrollService;
