/**
 * Regression tests for issues found in the project audit.
 * Each test documents a bug that previously existed and must stay fixed.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import { setupTestDB, teardownTestDB, clearDB } from './helpers.js';
import { User, generateEmployeeCode } from '../src/models/user.model.js';
import { Department } from '../src/models/department.model.js';
import { LeaveType } from '../src/models/leaveType.model.js';
import { Holiday } from '../src/models/holiday.model.js';
import { LeaveBalance } from '../src/models/leaveBalance.model.js';
import { LeaveRequest } from '../src/models/leaveRequest.model.js';
import { TrainingProgram } from '../src/models/trainingProgram.model.js';
import { env } from '../src/config/env.js';
import { getTodayDateKey } from '../src/services/leave.service.js';
import { todayKey } from '../src/utils/dates.js';

let app;
const PWD = 'Password123!';
const tok = (u) => jwt.sign({ sub: u._id, role: u.role, tv: u.tokenVersion || 0 }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
const auth = (u) => ({ Authorization: `Bearer ${tok(u)}` });

function futureWeekday(offset) {
  let d = dayjs().add(offset, 'day');
  while ([0, 6].includes(d.day())) d = d.add(1, 'day');
  return d.format('YYYY-MM-DD');
}

let hr, mgr, emp, emp2, casual, sick, dept;

async function mkUser(name, email, role, extra = {}) {
  return User.create({
    employeeCode: await generateEmployeeCode(),
    name, email, passwordHash: PWD, role, department: dept._id,
    designation: 'Tester', status: 'active', dateOfJoining: new Date('2020-01-01'), ...extra,
  });
}

beforeAll(async () => { app = await setupTestDB(); });
afterAll(async () => { await teardownTestDB(); });

beforeEach(async () => {
  await clearDB();
  dept = await Department.create({ name: 'Eng', code: 'ENG' });
  casual = await LeaveType.create({ name: 'Casual', code: 'CASUAL', annualQuota: 12 });
  sick = await LeaveType.create({ name: 'Sick', code: 'SICK', annualQuota: 10 });
  hr = await mkUser('HR', 'hr@t.com', 'hr');
  mgr = await mkUser('Mgr', 'mgr@t.com', 'manager');
  emp = await mkUser('Emp', 'emp@t.com', 'employee', { manager: mgr._id });
  emp2 = await mkUser('Emp2', 'emp2@t.com', 'employee', { manager: mgr._id });
});

describe('Authentication hardening', () => {
  it('has no hard-coded backdoor password', async () => {
    for (const pw of ['StaffSync@2026', 'Passw0rd!23']) {
      const r = await request(app).post('/api/auth/login').send({ email: 'emp@t.com', password: pw });
      expect(r.status).toBe(401);
    }
  });

  it('does not leak tokenVersion / __v in the login response', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'emp@t.com', password: PWD });
    expect(r.status).toBe(200);
    expect(r.body.data.user.tokenVersion).toBeUndefined();
    expect(r.body.data.user.passwordHash).toBeUndefined();
  });

  it('revokes existing access tokens when HR resets a password', async () => {
    const old = tok(emp);
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${old}`)).status).toBe(200);
    const reset = await request(app).post(`/api/employees/${emp._id}/reset-password`).set(auth(hr));
    expect(reset.status).toBe(200);
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${old}`)).status).toBe(401);
  });

  it('enforces mustChangePassword on the server, not just in the UI', async () => {
    await User.updateOne({ _id: emp._id }, { mustChangePassword: true });
    const fresh = await User.findById(emp._id);
    const blocked = await request(app).get('/api/employees/directory').set(auth(fresh));
    expect(blocked.status).toBe(403);
    const me = await request(app).get('/api/auth/me').set(auth(fresh));
    expect(me.status).toBe(200);
    const change = await request(app).post('/api/auth/change-password').set(auth(fresh))
      .send({ currentPassword: PWD, newPassword: 'NewPassword456!' });
    expect(change.status).toBe(200);
    const after = await request(app).get('/api/employees/directory')
      .set('Authorization', `Bearer ${change.body.data.accessToken}`);
    expect(after.status).toBe(200);
  });
});

describe('Error handling', () => {
  it('returns 400 (not 500) for malformed JSON', async () => {
    const r = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": bad');
    expect(r.status).toBe(400);
  });

  it('returns 413 (not 500) for oversized bodies', async () => {
    const r = await request(app).post('/api/auth/login').set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(150000) }));
    expect(r.status).toBe(413);
  });

  it('does not 500 when a query param is repeated (?q=a&q=b)', async () => {
    expect((await request(app).get('/api/employees?q=a&q=b').set(auth(hr))).status).toBe(200);
    expect((await request(app).get('/api/announcements?q=a&q=b').set(auth(emp))).status).toBe(200);
  });

  it('ignores non-whitelisted sort fields (cannot sort by passwordHash)', async () => {
    const r = await request(app).get('/api/employees?sortBy=passwordHash').set(auth(hr));
    expect(r.status).toBe(200);
  });
});

describe('Leave module', () => {
  it('/preview rejects impossible dates and huge ranges (no event-loop DoS)', async () => {
    const t0 = Date.now();
    const huge = await request(app).get('/api/leaves/preview?startDate=2026-01-01&endDate=9999-12-31').set(auth(emp));
    expect(huge.status).toBe(400);
    expect(Date.now() - t0).toBeLessThan(500);
    const bad = await request(app).get('/api/leaves/preview?startDate=2026-02-31&endDate=2026-02-31').set(auth(emp));
    expect(bad.status).toBe(400);
    const five = await request(app).get('/api/leaves/preview?startDate=2026-01-01&endDate=99999-01-01').set(auth(emp));
    expect(five.status).toBe(400);
  });

  it('rejects non-calendar dates when applying', async () => {
    const r = await request(app).post('/api/leaves').set(auth(emp))
      .send({ leaveType: String(casual._id), startDate: '2026-02-31', endDate: '2026-02-31', reason: 'invalid date probe' });
    expect(r.status).toBe(400);
  });

  it('a rejected application never leaves ghost "pending" days behind', async () => {
    const d = futureWeekday(20);
    const r = await request(app).post('/api/leaves').set(auth(emp))
      .send({ leaveType: String(casual._id), startDate: `${d} `, endDate: `${d} `, reason: 'ghost pending probe' });
    // whitespace is trimmed by validation now, so it is either accepted cleanly or rejected — never leaking
    const bal = await LeaveBalance.findOne({ user: emp._id, leaveType: casual._id });
    const reqs = await LeaveRequest.countDocuments({ user: emp._id });
    expect(bal.pending).toBe(reqs * 1);
    expect([201, 400]).toContain(r.status);
  });

  it('concurrent identical applications create exactly one request and reserve days once', async () => {
    const d = futureWeekday(30);
    const rs = await Promise.all(Array.from({ length: 6 }, () =>
      request(app).post('/api/leaves').set(auth(emp2))
        .send({ leaveType: String(casual._id), startDate: d, endDate: d, reason: 'concurrent apply probe' })));
    expect(rs.filter((r) => r.status === 201)).toHaveLength(1);
    expect(rs.every((r) => [201, 400, 409].includes(r.status))).toBe(true);
    expect(await LeaveRequest.countDocuments({ user: emp2._id })).toBe(1);
    const bal = await LeaveBalance.findOne({ user: emp2._id, leaveType: casual._id });
    expect(bal.pending).toBe(1);
  });

  it('cannot over-book the balance with concurrent requests', async () => {
    await request(app).get('/api/leaves/balances').set(auth(emp)); // initialise balances
    await LeaveBalance.updateOne({ user: emp._id, leaveType: casual._id }, { allocated: 1 });
    const days = [futureWeekday(40), futureWeekday(41), futureWeekday(42), futureWeekday(43)];
    const uniq = [...new Set(days)];
    const rs = await Promise.all(uniq.map((d) =>
      request(app).post('/api/leaves').set(auth(emp))
        .send({ leaveType: String(casual._id), startDate: d, endDate: d, reason: 'overbook probe' })));
    expect(rs.filter((r) => r.status === 201).length).toBeLessThanOrEqual(1);
    const bal = await LeaveBalance.findOne({ user: emp._id, leaveType: casual._id });
    expect(bal.pending).toBeLessThanOrEqual(bal.allocated);
  });

  it('concurrent cancels restore the balance exactly once', async () => {
    const d = futureWeekday(50);
    const ap = await request(app).post('/api/leaves').set(auth(emp)).send({ leaveType: String(casual._id), startDate: d, endDate: d, reason: 'cancel race probe' });
    expect(ap.status).toBe(201);
    const id = ap.body.leaveRequest._id;
    const rs = await Promise.all(Array.from({ length: 4 }, () => request(app).patch(`/api/leaves/${id}/cancel`).set(auth(emp))));
    expect(rs.filter((r) => r.status === 200)).toHaveLength(1);
    const bal = await LeaveBalance.findOne({ user: emp._id, leaveType: casual._id });
    expect(bal.pending).toBe(0);
  });

  it('calendar does not leak colleagues\' reasons, decision notes or leave category', async () => {
    const d = futureWeekday(10);
    const ap = await request(app).post('/api/leaves').set(auth(emp)).send({ leaveType: String(sick._id), startDate: d, endDate: d, reason: 'Chemotherapy session - private' });
    await request(app).patch(`/api/leaves/${ap.body.leaveRequest._id}/decision`).set(auth(mgr)).send({ decision: 'approved', note: 'confidential note' });
    const cal = await request(app).get(`/api/leaves/calendar?month=${d.slice(0, 7)}`).set(auth(emp2));
    expect(cal.status).toBe(200);
    const row = cal.body.leaves.find((l) => l.startDate === d);
    expect(row).toBeTruthy();
    expect(row.reason).toBeUndefined();
    expect(row.decisionNote).toBeUndefined();
    expect(row.leaveType.name).not.toMatch(/sick/i);
    // the owner still sees their own category
    const own = await request(app).get(`/api/leaves/calendar?month=${d.slice(0, 7)}`).set(auth(emp));
    expect(own.body.leaves.find((l) => l.startDate === d).leaveType.name).toMatch(/sick/i);
  });

  it('balance year is bounded (no unbounded balance-document creation)', async () => {
    const before = await LeaveBalance.countDocuments({ user: emp._id });
    expect((await request(app).get('/api/leaves/balances?year=1900').set(auth(emp))).status).toBe(400);
    expect((await request(app).get('/api/leaves/balances?year=99999').set(auth(emp))).status).toBe(400);
    expect(await LeaveBalance.countDocuments({ user: emp._id })).toBe(before);
  });

  it('concurrent first-time balance initialisation does not error', async () => {
    const rs = await Promise.all(Array.from({ length: 8 }, () => request(app).get('/api/leaves/balances').set(auth(emp))));
    expect(rs.every((r) => r.status === 200)).toBe(true);
    expect(await LeaveBalance.countDocuments({ user: emp._id })).toBe(2);
  });

  it('"today" for leave rules uses the company timezone helper', () => {
    expect(getTodayDateKey()).toBe(todayKey());
  });
});

describe('Dashboard', () => {
  it('returns upcoming holidays (previously always empty because of a bogus `year` filter)', async () => {
    const d = dayjs().add(3, 'day').format('YYYY-MM-DD');
    if (d.slice(0, 4) !== dayjs().format('YYYY')) return; // skip across year-end
    await Holiday.create({ name: 'Probe Day', date: d });
    const r = await request(app).get('/api/dashboard').set(auth(emp));
    expect(r.status).toBe(200);
    expect(r.body.data.upcomingHolidays.map((h) => h.date)).toContain(d);
  });
});

describe('Training', () => {
  const body = () => ({
    title: 'Probe Program', description: 'Probe description',
    startDate: new Date(Date.now() + 864e5).toISOString(), endDate: new Date(Date.now() + 2 * 864e5).toISOString(), capacity: 5,
  });

  it('PUT cannot change status or ownership (mass assignment)', async () => {
    const mk = await request(app).post('/api/training').set(auth(mgr)).send(body());
    const id = mk.body.program._id;
    const put = await request(app).put(`/api/training/${id}`).set(auth(mgr)).send({ title: 'Probe v2', status: 'completed', createdBy: String(hr._id) });
    expect(put.status).toBe(200);
    const doc = await TrainingProgram.findById(id).lean();
    expect(doc.title).toBe('Probe v2');
    expect(doc.status).toBe('draft');
    expect(String(doc.createdBy)).toBe(String(mgr._id));
  });

  it('enrollment updates are validated and employees cannot set scores', async () => {
    const mk = await request(app).post('/api/training').set(auth(mgr)).send(body());
    const id = mk.body.program._id;
    const en = await request(app).post(`/api/training/${id}/enroll`).set(auth(mgr)).send({ userIds: [String(emp._id)] });
    const eid = en.body.enrollments[0]._id;
    expect((await request(app).patch(`/api/training/enrollments/${eid}`).set(auth(emp)).send({ progress: 'abc' })).status).toBe(400);
    expect((await request(app).patch(`/api/training/enrollments/${eid}`).set(auth(emp)).send({ progress: 500 })).status).toBe(400);
    const sneaky = await request(app).patch(`/api/training/enrollments/${eid}`).set(auth(emp)).send({ score: 100 });
    expect(sneaky.status).toBe(200);
    expect(sneaky.body.enrollment.score).toBeNull();
  });

  it('a dropped employee can be re-enrolled', async () => {
    const mk = await request(app).post('/api/training').set(auth(mgr)).send(body());
    const id = mk.body.program._id;
    const en = await request(app).post(`/api/training/${id}/enroll`).set(auth(mgr)).send({ userIds: [String(emp._id)] });
    await request(app).patch(`/api/training/enrollments/${en.body.enrollments[0]._id}`).set(auth(emp)).send({ progress: 10 });
    await request(app).delete(`/api/training/${id}/enroll/${emp._id}`).set(auth(mgr)); // started -> 'dropped'
    const again = await request(app).post(`/api/training/${id}/enroll`).set(auth(mgr)).send({ userIds: [String(emp._id)] });
    expect(again.status).toBe(201);
  });
});

describe('Attendance', () => {
  it('rejects garbage timestamps with 400 (was 500)', async () => {
    const r = await request(app).post('/api/attendance/correct').set(auth(hr))
      .send({ userId: String(emp._id), date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), checkIn: 'garbage', correctionReason: 'probe' });
    expect(r.status).toBe(400);
  });

  it('refuses records for non-existent users / invalid dates / future dates', async () => {
    const ghost = await request(app).post('/api/attendance/correct').set(auth(hr))
      .send({ userId: '64b7f0c2a1b2c3d4e5f60718', date: '2026-02-28', checkIn: '2026-02-28T09:00:00Z', correctionReason: 'probe' });
    expect(ghost.status).toBe(404);
    const badDate = await request(app).post('/api/attendance/correct').set(auth(hr))
      .send({ userId: String(emp._id), date: '2026-02-31', checkIn: '2026-02-28T09:00:00Z', correctionReason: 'probe' });
    expect(badDate.status).toBe(400);
  });

  it('does not count days before the joining date as absent', async () => {
    const month = dayjs().format('YYYY-MM');
    await User.updateOne({ _id: emp._id }, { dateOfJoining: new Date() });
    const fresh = await User.findById(emp._id);
    const r = await request(app).get(`/api/attendance/my?month=${month}`).set(auth(fresh));
    expect(r.status).toBe(200);
    const first = r.body.days[0];
    if (first.date < dayjs().format('YYYY-MM-DD')) expect(first.derivedStatus).not.toBe('absent');
  });

  it('validates the month parameter (400 instead of 500/garbage)', async () => {
    expect((await request(app).get('/api/attendance/my?month=abc').set(auth(emp))).status).toBe(400);
    expect((await request(app).get('/api/attendance/export.csv?month=2026-01%0d%0aX:1').set(auth(hr))).status).toBe(400);
  });
});

describe('Employees', () => {
  it('prevents circular reporting chains', async () => {
    const a = await request(app).put(`/api/employees/${mgr._id}`).set(auth(hr)).send({ manager: String(emp._id) });
    expect(a.status).toBe(400);
  });

  it('blocks deactivating a manager who still has active reports', async () => {
    const r = await request(app).patch(`/api/employees/${mgr._id}/status`).set(auth(hr)).send({ status: 'inactive' });
    expect(r.status).toBe(409);
  });

  it('re-routes pending leave to the new manager when the manager changes', async () => {
    const mgr2 = await mkUser('Mgr2', 'mgr2@t.com', 'manager');
    const d = futureWeekday(12);
    const ap = await request(app).post('/api/leaves').set(auth(emp)).send({ leaveType: String(casual._id), startDate: d, endDate: d, reason: 'reroute probe' });
    expect(ap.status).toBe(201);
    await request(app).put(`/api/employees/${emp._id}`).set(auth(hr)).send({ manager: String(mgr2._id) });
    const lr = await LeaveRequest.findById(ap.body.leaveRequest._id);
    expect(String(lr.assignedTo)).toBe(String(mgr2._id));
  });
});
