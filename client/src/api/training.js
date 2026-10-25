import { http } from './http.js';

export async function getPrograms(params = {}) {
  const res = await http.get('/training', { params });
  return res.data;
}

export async function getProgramById(id) {
  const res = await http.get(`/training/${id}`);
  return res.data;
}

export async function createProgram(data) {
  const res = await http.post('/training', data);
  return res.data;
}

export async function updateProgram(id, data) {
  const res = await http.put(`/training/${id}`, data);
  return res.data;
}

export async function updateProgramStatus(id, status) {
  const res = await http.patch(`/training/${id}/status`, { status });
  return res.data;
}

export async function deleteProgram(id) {
  const res = await http.delete(`/training/${id}`);
  return res.data;
}

export async function enrollEmployees(id, userIds) {
  const res = await http.post(`/training/${id}/enroll`, { userIds });
  return res.data;
}

export async function dropEnrollment(programId, userId) {
  const res = await http.delete(`/training/${programId}/enroll/${userId}`);
  return res.data;
}

export async function getMyEnrollments() {
  const res = await http.get('/training/my');
  return res.data.enrollments;
}

export async function getUserEnrollments(userId) {
  const res = await http.get(`/training/user/${userId}`);
  return res.data.enrollments;
}

export async function updateEnrollment(enrollmentId, data) {
  const res = await http.patch(`/training/enrollments/${enrollmentId}`, data);
  return res.data;
}

export async function getTrainingSummary() {
  const res = await http.get('/training/reports/summary');
  return res.data.summary;
}
