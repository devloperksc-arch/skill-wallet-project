import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useNavigate } from 'react-router';
import AttendanceWidget from '../../components/attendance/AttendanceWidget.jsx';
import { getLatestAnnouncements } from '../../api/announcements.js';
import AnnouncementCard from '../../components/announcements/AnnouncementCard.jsx';
import { getOwnBalances } from '../../api/leaves.js';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getLatestAnnouncements(3).catch(() => []),
      getOwnBalances().catch(() => ({ balances: [] })),
    ]).then(([annRes, balRes]) => {
      if (isMounted) {
        setAnnouncements(annRes || []);
        setLeaveBalances(balRes.balances || []);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const totalAvailableDays = leaveBalances.reduce((sum, b) => {
    if (b.leaveType?.isUnlimited) return sum;
    return sum + Math.max(0, (b.allocated || 0) - (b.used || 0) - (b.pending || 0));
  }, 0);

  return (
    <div>
      <PageHeader
        title="Employee Portal"
        subtitle={`Welcome, ${user?.name || 'Employee'}. Manage your work, leaves, and attendance.`}
      />

      {/* Hero Welcome Card */}
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
              <i className="bi bi-calendar3 me-1"></i> My Attendance
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
      <AttendanceWidget />

      {/* Key Quick Stats */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 p-3 bg-success-subtle text-success">
                <i className="bi bi-calendar-heart fs-4"></i>
              </div>
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Leave Balance</span>
                <h4 className="fw-bold text-dark mb-0">{totalAvailableDays} Days</h4>
                <small className="text-success">Available for time-off</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 p-3 bg-primary-subtle text-primary">
                <i className="bi bi-clock-history fs-4"></i>
              </div>
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Shift Schedule</span>
                <h4 className="fw-bold text-dark mb-0">09:30 - 18:30</h4>
                <small className="text-primary">Standard Day Shift</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 p-3 bg-info-subtle text-info">
                <i className="bi bi-megaphone fs-4"></i>
              </div>
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Announcements</span>
                <h4 className="fw-bold text-dark mb-0">{announcements.length} Active</h4>
                <small className="text-info">Company updates</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Announcements Panel */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-megaphone text-primary fs-5"></i>
            <h5 className="fw-bold text-dark mb-0">Latest Company Announcements</h5>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/announcements')}
          >
            View All ({announcements.length}) &rarr;
          </button>
        </div>
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-4 text-muted">
              <div className="spinner-border spinner-border-sm text-primary me-2"></div>
              Loading bulletins...
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No recent announcements posted.
            </div>
          ) : (
            announcements.map((item) => (
              <AnnouncementCard key={item._id} announcement={item} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
