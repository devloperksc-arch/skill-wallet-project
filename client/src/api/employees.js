import http from './http.js';

export const employeeApi = {
  list: (params) => http.get('/employees', { params }),
  getDirectory: (params) => http.get('/employees/directory', { params }),
  getTeam: () => http.get('/employees/team'),
  get: (id) => http.get(`/employees/${id}`),
  create: (data) => http.post('/employees', data),
  update: (id, data) => http.put(`/employees/${id}`, data),
  updateMe: (data) => http.patch('/employees/me', data),
  updateStatus: (id, status) => http.patch(`/employees/${id}/status`, { status }),
  resetPassword: (id) => http.post(`/employees/${id}/reset-password`),
};
