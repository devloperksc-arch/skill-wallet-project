import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getDashboardData } from '../../api/dashboard.js';
import AttendanceWidget from '../../components/attendance/AttendanceWidget.jsx';
import AnnouncementCard from '../../components/announcements/AnnouncementCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useNavigate } from 'react-router';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await getDashboardData();
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to load Employee dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const d = dashboardData || {};
  const balances = d.leaveBalances || [];
  const trainings = d.myUpcomingTrainings || [];
  const holidays = d.upcomingHolidays || [];
  const nextLeave = d.nextApprovedLeave;

  const totalAvailableDays = balances.reduce((sum, b) => {
    if (b.leaveType?.isUnlimited) return sum;
    return sum + Math.max(0, (b.allocated || 0) - (b.used || 0) - (b.pending || 0));
  }, 0);

  return (
    <div className="container-fluid py-4">
      <PageHeader
        title="Employee Workspace"
        subtitle={`Welcome, ${user?.name || 'Employee'}. Manage your work attendance, time off, and training development.`}
      />

      {/* Hero Welcome Banner - Smoked Obsidian Glass */}
      <div className="glass-hero-banner position-relative overflow-hidden rounded-4 p-4 p-lg-5 mb-4 text-white">
        <div className="hero-specular-halo-1"></div>
        <div className="hero-specular-halo-2"></div>

        <div
          className="position-relative d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4"
          style={{ zIndex: 2 }}
        >
          <div className="d-flex align-items-center gap-3 gap-md-4">
            <div className="position-relative flex-shrink-0">
              <div
                className="rounded-4 d-flex align-items-center justify-content-center text-white fw-bold shadow-lg border border-white-20"
                style={{
                  width: '72px',
                  height: '72px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  fontSize: '1.5rem',
                }}
              >
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'EM'}
              </div>
              <div
                className="position-absolute bottom-0 end-0 rounded-circle bg-success d-flex align-items-center justify-content-center text-white shadow"
                style={{ width: '20px', height: '20px', border: '3px solid #111624', fontSize: '10px' }}
                title="Active"
              >
                <i className="bi bi-check-lg fw-bold"></i>
              </div>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <span className="badge-console">Employee Workspace</span>
                <span className="text-secondary">•</span>
                <span className="text-slate-300 font-monospace small">
                  {user?.employeeCode || 'EMP-0001'}
                </span>
              </div>
              <h1 className="hero-heading mb-1">{user?.name}</h1>
              <p className="text-slate-300 mb-0 small">
                {user?.designation || 'Staff'} &bull; {user?.department?.name || 'General Operations'} &bull; Status:{' '}
                <span className="text-success fw-semibold">Active Staff</span>
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn-ghost-smoked d-flex align-items-center gap-2 px-4 py-2.5 rounded-pill text-white fw-semibold"
              onClick={() => navigate('/attendance/my')}
            >
              <i className="bi bi-clock-history text-indigo-300"></i>
              <span>My Attendance</span>
            </button>
            <button
              type="button"
              className="btn-primary d-flex align-items-center gap-2 px-4 py-2.5 rounded-pill text-white fw-semibold shadow"
              onClick={() => navigate('/leaves/my')}
            >
              <i className="bi bi-calendar-plus me-1"></i>
              <span>Apply Leave</span>
              <i className="bi bi-arrow-right small"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Clock & Action Widget */}
      <AttendanceWidget onRefresh={loadData} />

      {/* KPI & Quick Cards Row */}
      <div className="row g-3 mb-4">
        {/* Leave Balance */}
        <div className="col-12 col-md-4">
          <div className="glass-card rounded-4 p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-3 p-3 text-success d-flex align-items-center justify-content-center"
                  style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(52, 211, 153, 0.35)', width: '48px', height: '48px' }}
                >
                  <i className="bi bi-calendar-heart fs-4"></i>
                </div>
                <div>
                  <span className="text-slate-400 small font-overline d-block">Annual Leave Balance</span>
                  <h3 className="fw-bold text-white mb-0 font-monospace">{loading ? '—' : totalAvailableDays} Days</h3>
                </div>
              </div>
              <p className="small text-slate-300 mb-3">
                Remaining available leave quota for {new Date().getFullYear()}.
              </p>
            </div>
            <button
              className="btn btn-ghost-smoked btn-sm rounded-pill text-success fw-semibold mt-auto"
              onClick={() => navigate('/leaves/my')}
            >
              View Balance Details &rarr;
            </button>
          </div>
        </div>

        {/* Next Approved Leave */}
        <div className="col-12 col-md-4">
          <div className="glass-card rounded-4 p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-3 p-3 text-primary d-flex align-items-center justify-content-center"
                  style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(129, 140, 248, 0.35)', width: '48px', height: '48px' }}
                >
                  <i className="bi bi-calendar2-check fs-4"></i>
                </div>
                <div>
                  <span className="text-slate-400 small font-overline d-block">Next Approved Leave</span>
                  <h5 className="fw-bold text-white mb-0">
                    {nextLeave ? nextLeave.leaveType?.name : 'None Scheduled'}
                  </h5>
                </div>
              </div>
              <p className="small text-slate-300 mb-3">
                {nextLeave
                  ? `${nextLeave.startDate} to ${nextLeave.endDate} (${nextLeave.days} day${nextLeave.days > 1 ? 's' : ''})`
                  : 'No approved upcoming time-off booked.'}
              </p>
            </div>
            <button
              className="btn btn-ghost-smoked btn-sm rounded-pill text-indigo-300 fw-semibold mt-auto"
              onClick={() => navigate('/leaves/calendar')}
            >
              Company Calendar &rarr;
            </button>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="col-12 col-md-4">
          <div className="glass-card rounded-4 p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-3 p-3 text-info d-flex align-items-center justify-content-center"
                  style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.35)', width: '48px', height: '48px' }}
                >
                  <i className="bi bi-mortarboard fs-4"></i>
                </div>
                <div>
                  <span className="text-slate-400 small font-overline d-block">Enrolled Trainings</span>
                  <h3 className="fw-bold text-white mb-0 font-monospace">{loading ? '—' : trainings.length} Active</h3>
                </div>
              </div>
              <p className="small text-slate-300 mb-3">
                Skill development workshops assigned by your manager.
              </p>
            </div>
            <button
              className="btn btn-ghost-smoked btn-sm rounded-pill text-info fw-semibold mt-auto"
              onClick={() => navigate('/trainings/my')}
            >
              My Courses &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Trainings & Holidays Split */}
      <div className="row g-4 mb-4">
        {/* My Enrolled Trainings List */}
        <div className="col-12 col-lg-7">
          <div className="glass-card rounded-4 p-4 h-100">
            <div className="d-flex justify-content-between align-items-center pb-3 border-bottom border-white-15 mb-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-mortarboard text-indigo-400 fs-5"></i>
                <h5 className="fw-bold text-white mb-0">My Active Learning Courses</h5>
              </div>
              <button
                className="btn btn-ghost-smoked btn-sm text-indigo-300"
                onClick={() => navigate('/trainings/my')}
              >
                View All &rarr;
              </button>
            </div>

            <div>
              {loading ? (
                <div className="text-center py-4 text-slate-400">Loading learning courses...</div>
              ) : trainings.length === 0 ? (
                <div className="text-center py-5 text-slate-400">
                  <i className="bi bi-mortarboard fs-2 text-slate-400 mb-2 d-block opacity-50"></i>
                  No active learning courses in progress.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {trainings.map((enr) => {
                    const prog = enr.program || {};
                    return (
                      <div
                        key={enr._id}
                        className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-white-10 border border-white-15"
                      >
                        <div className="flex-grow-1 me-3">
                          <div className="fw-semibold text-white">{prog.title || 'Course'}</div>
                          <div className="small text-slate-400">
                            Instructor: {prog.trainer || 'Internal'} &bull; {prog.mode}
                          </div>
                          <div
                            className="progress mt-2"
                            style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)' }}
                          >
                            <div
                              className="progress-bar bg-primary"
                              style={{ width: `${enr.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="text-end">
                          <span className="badge rounded-pill bg-purple-subtle text-purple border border-purple-subtle mb-1 font-monospace">
                            {enr.progress || 0}%
                          </span>
                          <div>
                            <button
                              className="btn btn-link btn-sm p-0 text-indigo-400 text-decoration-none small"
                              onClick={() => navigate('/trainings/my')}
                            >
                              Update &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Holidays */}
        <div className="col-12 col-lg-5">
          <div className="glass-card rounded-4 p-4 h-100">
            <div className="d-flex justify-content-between align-items-center pb-3 border-bottom border-white-15 mb-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-star text-warning fs-5"></i>
                <h5 className="fw-bold text-white mb-0">Upcoming Holidays</h5>
              </div>
              <button
                className="btn btn-ghost-smoked btn-sm text-indigo-300"
                onClick={() => navigate('/leaves/calendar')}
              >
                Calendar &rarr;
              </button>
            </div>

            <div>
              {loading ? (
                <div className="text-center py-4 text-slate-400">Loading holidays...</div>
              ) : holidays.length === 0 ? (
                <div className="text-center py-4 text-slate-400 small">No upcoming holidays scheduled.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {holidays.map((h) => (
                    <div
                      key={h._id}
                      className="d-flex justify-content-between align-items-center p-2.5 rounded-3 bg-white-10 border border-white-15"
                    >
                      <div>
                        <div className="fw-semibold text-white small">{h.name}</div>
                        <small className="text-slate-400 font-monospace">{h.date}</small>
                      </div>
                      <span className="badge rounded-pill bg-amber-subtle text-amber border border-amber-subtle">
                        Public Holiday
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Latest Announcements */}
      <div className="glass-card rounded-4 p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center pb-3 border-bottom border-white-15 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-megaphone text-indigo-400 fs-5"></i>
            <h5 className="fw-bold text-white mb-0">Company Announcements</h5>
          </div>
          <button
            className="btn btn-ghost-smoked btn-sm text-indigo-300"
            onClick={() => navigate('/announcements')}
          >
            View Feed &rarr;
          </button>
        </div>

        <div>
          {loading ? (
            <div className="text-center py-4 text-slate-400">Loading bulletins...</div>
          ) : !d.latestAnnouncements || d.latestAnnouncements.length === 0 ? (
            <div className="text-center py-4 text-slate-400">No recent announcements posted.</div>
          ) : (
            d.latestAnnouncements.map((item) => (
              <AnnouncementCard key={item._id} announcement={item} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
