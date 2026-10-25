import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getDashboardData } from '../../api/dashboard.js';
import AnnouncementCard from '../../components/announcements/AnnouncementCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import {
  DepartmentBarChart,
  LeaveStatusDonutChart,
  AttendanceTrendLineChart,
} from '../../components/dashboard/Charts.jsx';
import { useNavigate } from 'react-router';

export default function HrDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await getDashboardData();
        if (isMounted) {
          setDashboardData(res.data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load HR dashboard data', err);
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const d = dashboardData || {};

  return (
    <div className="container-fluid py-4">
      <PageHeader
        title="Executive HR Overview"
        subtitle={`Welcome back, ${user?.name || 'Administrator'}. Here is your organizational pulse and real-time operations overview.`}
      />

      {/* Hero Welcome Banner */}
      <div className="card border-0 bg-primary text-white rounded-4 shadow-sm mb-4 p-4 overflow-hidden position-relative">
        <div className="position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span className="badge bg-white text-primary fw-semibold mb-2 px-3 py-1 rounded-pill">
                HR Administration & Analytics
              </span>
              <h3 className="fw-bold mb-1">{user?.name}</h3>
              <p className="text-white-50 mb-0">
                {user?.designation || 'HR Director'} &bull; {user?.department?.name || 'Human Resources'} &bull; Employee Code: {user?.employeeCode}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-light fw-semibold px-3 py-2 rounded-3"
                onClick={() => navigate('/attendance')}
              >
                <i className="bi bi-clock-history me-1"></i> Attendance Logs
              </button>
              <button
                className="btn btn-light text-primary fw-semibold px-3 py-2 rounded-3 shadow-sm"
                onClick={() => navigate('/employees')}
              >
                <i className="bi bi-people me-1"></i> Workforce
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/employees')}>
          <StatCard
            title="Total Workforce"
            value={loading ? '—' : d.totalEmployees}
            icon="bi-people-fill"
            color="primary"
            trend={`${d.activeEmployees || 0} active employees`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/attendance')}>
          <StatCard
            title="Present Today"
            value={loading ? '—' : d.presentToday}
            icon="bi-person-check-fill"
            color="success"
            trend={`${d.lateToday || 0} late arrivals`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/leaves/requests')}>
          <StatCard
            title="Pending Leaves"
            value={loading ? '—' : d.pendingLeaves}
            icon="bi-calendar2-check"
            color="warning"
            trend={`${d.onLeaveToday || 0} on leave today`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/trainings')}>
          <StatCard
            title="Training Completion"
            value={loading ? '—' : `${d.trainingCompletionRate || 0}%`}
            icon="bi-mortarboard-fill"
            color="info"
            trend="Org skill proficiency"
          />
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="row g-4 mb-4">
        {/* Department Headcount Bar Chart */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 rounded-4 p-4 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">Department Headcount Distribution</h5>
                <small className="text-muted">Active employee counts across business units</small>
              </div>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/departments')}>
                View Units &rarr;
              </button>
            </div>
            {loading ? (
              <div className="text-center py-5 text-muted">
                <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                Loading department metrics...
              </div>
            ) : (
              <DepartmentBarChart data={d.headcountByDepartment || []} />
            )}
          </div>
        </div>

        {/* Leave Requests Donut Chart */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 rounded-4 p-4 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">Leave Status Distribution</h5>
                <small className="text-muted">Applications breakdown this year</small>
              </div>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/leaves/requests')}>
                Requests &rarr;
              </button>
            </div>
            {loading ? (
              <div className="text-center py-5 text-muted">
                <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                Loading leave distribution...
              </div>
            ) : (
              <LeaveStatusDonutChart data={d.leaveRequestsByStatus} />
            )}
          </div>
        </div>

        {/* 30-Day Attendance Trend Line Chart */}
        <div className="col-12">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h5 className="fw-bold text-dark mb-0">30-Day Attendance Rate Trend</h5>
                <small className="text-muted">Company-wide daily presence percentage over the last 30 calendar days</small>
              </div>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/attendance')}>
                Attendance Report &rarr;
              </button>
            </div>
            {loading ? (
              <div className="text-center py-5 text-muted">
                <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                Loading attendance trend...
              </div>
            ) : (
              <AttendanceTrendLineChart data={d.attendanceRateTrend || []} />
            )}
          </div>
        </div>
      </div>

      {/* Announcements & Holidays Row */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-megaphone text-primary fs-5"></i>
                <h5 className="fw-bold text-dark mb-0">Company Announcements</h5>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => navigate('/announcements/manage')}
                >
                  <i className="bi bi-gear me-1"></i> Manage
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate('/announcements')}
                >
                  Feed &rarr;
                </button>
              </div>
            </div>
            <div className="card-body p-4">
              {loading ? (
                <div className="text-center py-4 text-muted">
                  <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                  Loading bulletins...
                </div>
              ) : !d.latestAnnouncements || d.latestAnnouncements.length === 0 ? (
                <div className="text-center py-4 text-muted">No active announcements posted yet.</div>
              ) : (
                d.latestAnnouncements.map((item) => (
                  <AnnouncementCard key={item._id} announcement={item} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Holidays */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-calendar-event text-warning fs-5"></i>
                <h5 className="fw-bold text-dark mb-0">Upcoming Holidays</h5>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate('/leaves/calendar')}
              >
                Calendar &rarr;
              </button>
            </div>
            <div className="card-body p-3">
              {loading ? (
                <div className="text-center py-4 text-muted">Loading holidays...</div>
              ) : !d.upcomingHolidays || d.upcomingHolidays.length === 0 ? (
                <div className="text-center py-4 text-muted small">No upcoming holidays scheduled.</div>
              ) : (
                <ul className="list-group list-group-flush">
                  {d.upcomingHolidays.map((h) => (
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
    </div>
  );
}
