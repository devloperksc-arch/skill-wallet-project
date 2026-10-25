import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { employeeApi } from '../../api/employees.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useNavigate } from 'react-router';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teamCount, setTeamCount] = useState('—');

  useEffect(() => {
    let isMounted = true;
    employeeApi.getTeam().then((res) => {
      if (isMounted) {
        setTeamCount(res.data.data?.length ?? 0);
      }
    }).catch(() => {});
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
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Team On Leave"
            value="0"
            icon="bi-calendar-check"
            color="info"
            trend="All present"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Pending Requests"
            value="0"
            icon="bi-hourglass-split"
            color="warning"
            trend="Coming in Chapter 3"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Team Attendance"
            value="100%"
            icon="bi-check-circle"
            color="success"
            trend="Coming in Chapter 4"
          />
        </div>
      </div>

      {/* Action cards */}
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-primary-subtle text-primary rounded-3 p-3">
                <i className="bi bi-people fs-4"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0">Team Directory</h6>
                <small className="text-muted">Direct reports & roles</small>
              </div>
            </div>
            <p className="text-muted small mb-3">
              View your team members' records, contact details, and assigned projects.
            </p>
            <button
              className="btn btn-outline-primary btn-sm rounded-2 mt-auto"
              onClick={() => navigate('/team')}
            >
              Open Team List &rarr;
            </button>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-warning-subtle text-warning rounded-3 p-3">
                <i className="bi bi-calendar2-range fs-4"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0">Leave Approvals</h6>
                <small className="text-muted">Review team time-off</small>
              </div>
            </div>
            <p className="text-muted small mb-3">
              Review and approve or reject leave applications submitted by your team members.
            </p>
            <button
              className="btn btn-outline-warning btn-sm rounded-2 mt-auto"
              onClick={() => navigate('/leaves/team')}
            >
              Review Leaves &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
