import { http } from './http.js';

export async function getAnnouncements(params = {}) {
  const res = await http.get('/announcements', { params });
  return res.data;
}

export async function getLatestAnnouncements(limit = 5) {
  const res = await http.get('/announcements/latest', { params: { limit } });
  return res.data.announcements;
}

export async function getAnnouncementById(id) {
  const res = await http.get(`/announcements/${id}`);
  return res.data.announcement;
}

export async function getManageAnnouncements(params = {}) {
  const res = await http.get('/announcements/manage', { params });
  return res.data;
}

export async function createAnnouncement(data) {
  const res = await http.post('/announcements', data);
  return res.data;
}

export async function updateAnnouncement(id, data) {
  const res = await http.put(`/announcements/${id}`, data);
  return res.data;
}

export async function deleteAnnouncement(id) {
  const res = await http.delete(`/announcements/${id}`);
  return res.data;
}

export async function togglePin(id) {
  const res = await http.patch(`/announcements/${id}/pin`);
  return res.data;
}
