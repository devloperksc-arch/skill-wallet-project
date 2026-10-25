import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { employeeApi } from '../../api/employees.js';
import { departmentApi } from '../../api/departments.js';
import { getPendingApprovals } from '../../api/leaves.js';
import { getAllAttendance } from '../../api/attendance.js';
import { getLatestAnnouncements } from '../../api/announcements.js';
import AnnouncementCard from '../../components/announcements/AnnouncementCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useNavigate } from 'react-router';

export default function HrDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  const [metrics, setMetrics] = useState({
    totalEmployees: '—',
    activeEmployees: '—',
    totalDepartments: '—',
    pendingLeaves: '—',
    presentToday: '—',
    lateToday: 0,
    loading: true,
  });
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadMetrics() {
      try {
        const [empRes, deptRes, pendingRes, attRes, annRes] = await Promise.all([
          employeeApi.list({ limit: 1 }),
          departmentApi.list(),
          getPendingApprovals().catch(() => ({ leaves: [] })),
          getAllAttendance({ date: todayStr, limit: 1000 }).catch(() => ({ count: 0, attendance: [] })),
          getLatestAnnouncements(3).catch(() => []),
        ]);
        if (isMounted) {
          const presentCount = attRes.attendance?.filter((a) => a.status === 'present' || a.status === 'half-day').length || 0;
          const lateCount = attRes.attendance?.filter((a) => a.isLate).length || 0;

          setMetrics({
            totalEmployees: empRes.data.pagination?.total ?? '—',
            activeEmployees: empRes.data.pagination?.total ?? '—',
            totalDepartments: deptRes.data.data?.length ?? '—',
            pendingLeaves: pendingRes.leaves?.length ?? 0,
            presentToday: presentCount,
            lateToday: lateCount,
            loading: false,
          });
          setAnnouncements(annRes || []);
        }
      } catch (err) {
        if (isMounted) {
          setMetrics((prev) => ({ ...prev, loading: false }));
        }
      }
    }
    loadMetrics();
    return () => {
      isMounted = false;
    };
  }, [todayStr]);

  return (
    <div>
      <PageHeader
        title="HR Overview"
        subtitle={`Welcome back, ${user?.name || 'Administrator'}. Here is what's happening across the organization.`}
      />

      {/* Hero Welcome Card */}
      <div className="card border-0 bg-primary text-white rounded-4 shadow-sm mb-4 p-4 overflow-hidden position-relative">
        <div className="position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span className="badge bg-white text-primary fw-semibold mb-2 px-3 py-1 rounded-pill">
                HR Administration Portal
              </span>
              <h3 className="fw-bold mb-1">{user?.name}</h3>
              <p className="text-white-50 mb-0">
                {user?.designation || 'HR Manager'} &bull; {user?.department?.name || 'Human Resources'} &bull; Code: {user?.employeeCode}
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
                <i className="bi bi-people me-1"></i> Manage Workforce
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics / StatCards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/employees')}>
          <StatCard
            title="Total Employees"
            value={metrics.totalEmployees}
            icon="bi-people-fill"
            color="primary"
            trend="Workforce directory"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/attendance')}>
          <StatCard
            title="Present Today"
            value={metrics.presentToday}
            icon="bi-person-check-fill"
            color="success"
            trend={`${metrics.lateToday} late arrivals`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/leaves/requests')}>
          <StatCard
            title="Pending Leaves"
            value={metrics.pendingLeaves}
            icon="bi-calendar2-check"
            color="warning"
            trend="Awaiting HR review"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/departments')}>
          <StatCard
            title="Departments"
            value={metrics.totalDepartments}
            icon="bi-building"
            color="info"
            trend="Active divisions"
          />
        </div>
      </div>

      {/* Latest Announcements */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white">
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
              <i className="bi bi-gear me-1"></i> Manage Bulletins
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
          {metrics.loading ? (
            <div className="text-center py-4 text-muted">
              <div className="spinner-border spinner-border-sm text-primary me-2"></div>
              Loading bulletins...
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No active announcements posted yet.
            </div>
          ) : (
            announcements.map((item) => (
              <AnnouncementCard key={item._id} announcement={item} />
            ))
          )}
        </div>
      </div>

      {/* Quick Nav Action Cards */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-primary-subtle text-primary rounded-3 p-3 d-flex align-items-center justify-content-center">
                <i className="bi bi-person-lines-fill fs-4"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0">Employee Directory</h6>
                <small className="text-muted">Workforce records</small>
              </div>
            </div>
            <p className="text-muted small mb-3">
              View and manage employee profiles, departments, managers, and account statuses.
            </p>
            <button
              className="btn btn-outline-primary btn-sm rounded-2 mt-auto"
              onClick={() => navigate('/employees')}
            >
              Explore Directory &rarr;
            </button>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-success-subtle text-success rounded-3 p-3 d-flex align-items-center justify-content-center">
                <i className="bi bi-clock-history fs-4"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0">Attendance Tracking</h6>
                <small className="text-muted">Time & daily logs</small>
              </div>
            </div>
            <p className="text-muted small mb-3">
              Review daily check-ins, monthly summaries, download Excel/CSV reports, and correct times.
            </p>
            <button
              className="btn btn-outline-success btn-sm rounded-2 mt-auto"
              onClick={() => navigate('/attendance')}
            >
              Manage Attendance &rarr;
            </button>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-info-subtle text-info rounded-3 p-3 d-flex align-items-center justify-content-center">
                <i className="bi bi-megaphone-fill fs-4"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0">Announcements</h6>
                <small className="text-muted">Company communications</small>
              </div>
            </div>
            <p className="text-muted small mb-3">
              Broadcast company-wide updates, policy notices, and pin critical announcements.
            </p>
            <button
              className="btn btn-outline-info btn-sm rounded-2 mt-auto"
              onClick={() => navigate('/announcements/manage')}
            >
              Post Announcements &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
