import { http } from './http.js';

export async function getHolidays(year) {
  const params = year ? { year } : {};
  const res = await http.get('/holidays', { params });
  return res.data;
}

export async function createHoliday(data) {
  const res = await http.post('/holidays', data);
  return res.data;
}

export async function updateHoliday(id, data) {
  const res = await http.put(`/holidays/${id}`, data);
  return res.data;
}

export async function deleteHoliday(id) {
  const res = await http.delete(`/holidays/${id}`);
  return res.data;
}
