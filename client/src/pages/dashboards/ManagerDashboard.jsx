import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { employeeApi } from '../../api/employees.js';
import { getPendingApprovals } from '../../api/leaves.js';
import { getTeamAttendance } from '../../api/attendance.js';
import { getLatestAnnouncements } from '../../api/announcements.js';
import AnnouncementCard from '../../components/announcements/AnnouncementCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useNavigate } from 'react-router';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teamCount, setTeamCount] = useState('—');
  const [pendingCount, setPendingCount] = useState('—');
  const [attendanceSummary, setAttendanceSummary] = useState({
    presentCount: 0,
    lateCount: 0,
    onLeaveCount: 0,
    notCheckedInCount: 0,
  });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      employeeApi.getTeam().catch(() => ({ data: { data: [] } })),
      getPendingApprovals().catch(() => ({ leaves: [] })),
      getTeamAttendance().catch(() => ({ teamSummary: null })),
      getLatestAnnouncements(3).catch(() => []),
    ]).then(([teamRes, pendingRes, attRes, annRes]) => {
      if (isMounted) {
        setTeamCount(teamRes.data.data?.length ?? 0);
        setPendingCount(pendingRes.leaves?.length ?? 0);
        if (attRes.teamSummary) {
          setAttendanceSummary(attRes.teamSummary);
        }
        setAnnouncements(annRes || []);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Manager Overview"
        subtitle={`Welcome back, ${user?.name || 'Manager'}. Here is your team overview.`}
      />

      {/* Hero Welcome Card */}
      <div className="card border-0 bg-dark text-white rounded-4 shadow-sm mb-4 p-4 overflow-hidden position-relative">
        <div className="position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span className="badge bg-primary text-white fw-semibold mb-2 px-3 py-1 rounded-pill">
                Team Management Portal
              </span>
              <h3 className="fw-bold mb-1">{user?.name}</h3>
              <p className="text-white-50 mb-0">
                {user?.designation || 'Team Lead'} &bull; {user?.department?.name || 'Engineering'} &bull; Code: {user?.employeeCode}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-light fw-semibold px-3 py-2 rounded-3"
                onClick={() => navigate('/attendance/team')}
              >
                <i className="bi bi-clock-history me-1"></i> Team Attendance
              </button>
              <button
                className="btn btn-primary fw-semibold px-3 py-2 rounded-3 shadow-sm"
                onClick={() => navigate('/team')}
              >
                <i className="bi bi-people me-1"></i> View My Team
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Direct Reports"
            value={teamCount}
            icon="bi-people-fill"
            color="primary"
            trend="Active team members"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/attendance/team')}>
          <StatCard
            title="Present Today"
            value={attendanceSummary.presentCount}
            icon="bi-person-check-fill"
            color="success"
            trend={`${attendanceSummary.lateCount} late arrivals`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/leaves/approvals')}>
          <StatCard
            title="Pending Requests"
            value={pendingCount}
            icon="bi-hourglass-split"
            color="warning"
            trend="Awaiting your approval"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/attendance/team')}>
          <StatCard
            title="Team On Leave"
            value={attendanceSummary.onLeaveCount}
            icon="bi-calendar-check"
            color="info"
            trend={`${attendanceSummary.notCheckedInCount} not checked in`}
          />
        </div>
      </div>

      {/* Latest Announcements */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-megaphone text-primary fs-5"></i>
            <h5 className="fw-bold text-dark mb-0">Company Bulletins</h5>
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
