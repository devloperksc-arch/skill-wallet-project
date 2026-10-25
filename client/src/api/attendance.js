import { http } from './http.js';

export async function checkIn() {
  const res = await http.post('/attendance/check-in');
  return res.data;
}

export async function checkOut() {
  const res = await http.post('/attendance/check-out');
  return res.data;
}

export async function getTodayStatus() {
  const res = await http.get('/attendance/today');
  return res.data;
}

export async function getMyMonthlyAttendance(month) {
  const params = month ? { month } : {};
  const res = await http.get('/attendance/my', { params });
  return res.data;
}

export async function getTeamAttendance(date) {
  const params = date ? { date } : {};
  const res = await http.get('/attendance/team', { params });
  return res.data;
}

export async function getTeamAttendanceSummary(month) {
  const params = month ? { month } : {};
  const res = await http.get('/attendance/team/summary', { params });
  return res.data;
}

export async function getAllAttendance(params = {}) {
  const res = await http.get('/attendance', { params });
  return res.data;
}

export async function getMonthlyAttendanceSummary(params = {}) {
  const res = await http.get('/attendance/summary', { params });
  return res.data;
}

export function getExportAttendanceCsvUrl(month) {
  return `/api/attendance/export.csv?month=${encodeURIComponent(month || '')}`;
}

export async function correctAttendance(id, data) {
  const res = await http.put(`/attendance/${id}`, data);
  return res.data;
}

export async function createMissingAttendance(data) {
  const res = await http.post('/attendance/correct', data);
  return res.data;
}
