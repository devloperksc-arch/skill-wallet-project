import http from './http.js';

export const authApi = {
  login: (data) => http.post('/auth/login', data),
  logout: () => http.post('/auth/logout'),
  refresh: () => http.post('/auth/refresh'),
  me: () => http.get('/auth/me'),
  changePassword: (data) => http.post('/auth/change-password', data),
};
