import { http } from './http.js';

export async function previewLeave({ startDate, endDate, halfDay }) {
  const res = await http.get('/leaves/preview', {
    params: { startDate, endDate, halfDay },
  });
  return res.data;
}

export async function getOwnBalances(year) {
  const params = year ? { year } : {};
  const res = await http.get('/leaves/balances', { params });
  return res.data;
}

export async function getUserBalances(userId, year) {
  const params = year ? { year } : {};
  const res = await http.get(`/leaves/balances/${userId}`, { params });
  return res.data;
}

export async function adjustBalance(id, { allocated, reason }) {
  const res = await http.patch(`/leaves/balances/${id}`, { allocated, reason });
  return res.data;
}

export async function applyLeave(data) {
  const res = await http.post('/leaves', data);
  return res.data;
}

export async function getMyLeaves(params = {}) {
  const res = await http.get('/leaves/my', { params });
  return res.data;
}

export async function getAllLeaves(params = {}) {
  const res = await http.get('/leaves', { params });
  return res.data;
}

export async function getPendingApprovals() {
  const res = await http.get('/leaves/pending-approvals');
  return res.data;
}

export async function getLeaveById(id) {
  const res = await http.get(`/leaves/${id}`);
  return res.data.leave;
}

export async function decideLeave(id, { decision, note }) {
  const res = await http.patch(`/leaves/${id}/decision`, { decision, note });
  return res.data;
}

export async function cancelLeave(id) {
  const res = await http.patch(`/leaves/${id}/cancel`);
  return res.data;
}

export async function getLeaveCalendar(month) {
  const params = month ? { month } : {};
  const res = await http.get('/leaves/calendar', { params });
  return res.data;
}
