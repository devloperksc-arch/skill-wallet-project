import { http } from './http.js';

export async function getLeaveTypes() {
  const res = await http.get('/leave-types');
  return res.data.leaveTypes;
}

export async function createLeaveType(data) {
  const res = await http.post('/leave-types', data);
  return res.data;
}

export async function updateLeaveType(id, data) {
  const res = await http.put(`/leave-types/${id}`, data);
  return res.data;
}

export async function deleteLeaveType(id) {
  const res = await http.delete(`/leave-types/${id}`);
  return res.data;
}
