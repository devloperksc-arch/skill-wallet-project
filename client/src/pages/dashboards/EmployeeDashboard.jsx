import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useNavigate } from 'react-router';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Employee Portal"
        subtitle={`Welcome, ${user?.name || 'Employee'}. Manage your work, leaves, and attendance.`}
      />

      {/* Hero Welcome Card */}
      <div className="card border-0 bg-info-subtle text-dark rounded-4 shadow-sm mb-4 p-4 overflow-hidden position-relative border border-info-subtle">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <span className="badge bg-primary text-white fw-semibold mb-2 px-3 py-1 rounded-pill">
              Employee Workspace
            </span>
            <h3 className="fw-bold mb-1">{user?.name}</h3>
            <p className="text-muted mb-0">
              {user?.designation || 'Software Engineer'} &bull; {user?.department?.name || 'Engineering'} &bull; Employee Code: <span className="fw-bold text-dark">{user?.employeeCode}</span>
            </p>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-primary fw-semibold px-3 py-2 rounded-3 shadow-sm"
              onClick={() => navigate('/leaves/my')}
            >
              <i className="bi bi-calendar-plus me-1"></i> Apply for Leave
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Annual Leave Balance"
            value="18"
            icon="bi-calendar-heart"
            color="success"
            trend="Days remaining"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Monthly Attendance"
            value="100%"
            icon="bi-clock-check"
            color="primary"
            trend="All days logged"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Enrolled Trainings"
            value="0"
            icon="bi-journal-bookmark"
            color="warning"
            trend="Coming in Chapter 5"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Announcements"
            value="1"
            icon="bi-bell"
            color="info"
            trend="New company notice"
          />
        </div>
      </div>

      {/* Action cards */}
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-success-subtle text-success rounded-3 p-3">
                <i className="bi bi-calendar-check fs-4"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0">My Time Off</h6>
                <small className="text-muted">Applications & balances</small>
              </div>
            </div>
            <p className="text-muted small mb-3">
              Submit new leave requests, check your remaining annual/sick leave balances, and track approval status.
            </p>
            <button
              className="btn btn-outline-success btn-sm rounded-2 mt-auto"
              onClick={() => navigate('/leaves/my')}
            >
              View My Leaves &rarr;
            </button>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-primary-subtle text-primary rounded-3 p-3">
                <i className="bi bi-clock-history fs-4"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0">Daily Attendance</h6>
                <small className="text-muted">Clock in & clock out</small>
              </div>
            </div>
            <p className="text-muted small mb-3">
              Mark your daily check-in and check-out, view your work hours breakdown, and monthly attendance history.
            </p>
            <button
              className="btn btn-outline-primary btn-sm rounded-2 mt-auto"
              onClick={() => navigate('/attendance/my')}
            >
              Check Attendance &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
