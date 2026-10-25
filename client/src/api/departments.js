import http from './http.js';

export const departmentApi = {
  list: () => http.get('/departments'),
  get: (id) => http.get(`/departments/${id}`),
  create: (data) => http.post('/departments', data),
  update: (id, data) => http.put(`/departments/${id}`, data),
  delete: (id) => http.delete(`/departments/${id}`),
};
