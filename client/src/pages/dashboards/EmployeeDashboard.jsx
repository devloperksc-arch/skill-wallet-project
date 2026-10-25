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
        title="Employee Portal"
        subtitle={`Welcome, ${user?.name || 'Employee'}. Manage your work attendance, time off, and training development.`}
      />

      {/* Hero Welcome Banner */}
      <div className="card border-0 bg-light-subtle rounded-4 shadow-sm mb-4 p-4 position-relative border">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <span className="badge bg-primary text-white fw-semibold mb-2 px-3 py-1 rounded-pill">
              Employee Workspace
            </span>
            <h3 className="fw-bold mb-1 text-dark">{user?.name}</h3>
            <p className="text-secondary small mb-0">
              {user?.designation || 'Staff'} &bull; {user?.department?.name || 'General'} &bull; Code: <span className="fw-bold text-dark">{user?.employeeCode}</span>
            </p>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary fw-semibold px-3 py-2 rounded-3"
              onClick={() => navigate('/attendance/my')}
            >
              <i className="bi bi-clock-history me-1"></i> My Attendance
            </button>
            <button
              className="btn btn-primary fw-semibold px-3 py-2 rounded-3 shadow-sm"
              onClick={() => navigate('/leaves/my')}
            >
              <i className="bi bi-calendar-plus me-1"></i> Apply Leave
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
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="rounded-3 p-3 bg-success-subtle text-success">
                <i className="bi bi-calendar-heart fs-4"></i>
              </div>
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Annual Leave Balance</span>
                <h3 className="fw-bold text-success mb-0">{loading ? '—' : totalAvailableDays} Days</h3>
              </div>
            </div>
            <p className="small text-muted mb-3">
              Remaining available leave quota for {new Date().getFullYear()}.
            </p>
            <button
              className="btn btn-outline-success btn-sm rounded-2 mt-auto"
              onClick={() => navigate('/leaves/my')}
            >
              View Balance Details &rarr;
            </button>
          </div>
        </div>

        {/* Next Approved Leave */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="rounded-3 p-3 bg-primary-subtle text-primary">
                <i className="bi bi-calendar2-check fs-4"></i>
              </div>
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Next Approved Leave</span>
                <h5 className="fw-bold text-dark mb-0">
                  {nextLeave ? nextLeave.leaveType?.name : 'None Scheduled'}
                </h5>
              </div>
            </div>
            <p className="small text-muted mb-3">
              {nextLeave
                ? `${nextLeave.startDate} to ${nextLeave.endDate} (${nextLeave.days} day${nextLeave.days > 1 ? 's' : ''})`
                : 'No approved upcoming time-off booked.'}
            </p>
            <button
              className="btn btn-outline-primary btn-sm rounded-2 mt-auto"
              onClick={() => navigate('/leaves/calendar')}
            >
              Company Calendar &rarr;
            </button>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="rounded-3 p-3 bg-info-subtle text-info">
                <i className="bi bi-mortarboard fs-4"></i>
              </div>
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Enrolled Trainings</span>
                <h3 className="fw-bold text-info mb-0">{loading ? '—' : trainings.length} Active</h3>
              </div>
            </div>
            <p className="small text-muted mb-3">
              Skill development workshops assigned by your manager.
            </p>
            <button
              className="btn btn-outline-info btn-sm rounded-2 mt-auto"
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
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-mortarboard text-primary fs-5"></i>
                <h5 className="fw-bold text-dark mb-0">My Active Learning Courses</h5>
              </div>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/trainings/my')}>
                View All &rarr;
              </button>
            </div>
            <div className="card-body p-3">
              {loading ? (
                <div className="text-center py-4 text-muted">Loading learning courses...</div>
              ) : trainings.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-mortarboard fs-2 text-secondary mb-2 d-block opacity-50"></i>
                  No active learning courses in progress.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {trainings.map((enr) => {
                    const prog = enr.program || {};
                    return (
                      <div
                        key={enr._id}
                        className="list-group-item d-flex justify-content-between align-items-center p-3"
                      >
                        <div className="flex-grow-1 me-3">
                          <div className="fw-semibold text-dark">{prog.title || 'Course'}</div>
                          <div className="small text-muted">
                            Instructor: {prog.trainer || 'Internal'} &bull; {prog.mode}
                          </div>
                          <div className="progress mt-2" style={{ height: '6px' }}>
                            <div
                              className="progress-bar bg-primary"
                              style={{ width: `${enr.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="text-end">
                          <span className="badge bg-primary-subtle text-primary border mb-1">
                            {enr.progress || 0}%
                          </span>
                          <div>
                            <button
                              className="btn btn-link btn-sm p-0 text-decoration-none"
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
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-star text-warning fs-5"></i>
                <h5 className="fw-bold text-dark mb-0">Upcoming Holidays</h5>
              </div>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/leaves/calendar')}>
                Calendar &rarr;
              </button>
            </div>
            <div className="card-body p-3">
              {loading ? (
                <div className="text-center py-4 text-muted">Loading holidays...</div>
              ) : holidays.length === 0 ? (
                <div className="text-center py-4 text-muted small">No upcoming holidays scheduled.</div>
              ) : (
                <ul className="list-group list-group-flush">
                  {holidays.map((h) => (
                    <li key={h._id} className="list-group-item d-flex justify-content-between align-items-center px-2 py-3">
                      <div>
                        <div className="fw-semibold text-dark">{h.name}</div>
                        <small className="text-muted">{h.date}</small>
                      </div>
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                        Public Holiday
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Latest Announcements */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-megaphone text-primary fs-5"></i>
            <h5 className="fw-bold text-dark mb-0">Company Announcements</h5>
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/announcements')}>
            View Feed &rarr;
          </button>
        </div>
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-4 text-muted">Loading bulletins...</div>
          ) : !d.latestAnnouncements || d.latestAnnouncements.length === 0 ? (
            <div className="text-center py-4 text-muted">No recent announcements posted.</div>
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
