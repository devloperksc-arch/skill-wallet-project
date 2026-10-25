import { http } from './http.js';

export async function getDashboardData() {
  const res = await http.get('/dashboard');
  return res.data;
}
