import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { employeeApi } from '../../api/employees.js';
import { departmentApi } from '../../api/departments.js';
import { getPendingApprovals } from '../../api/leaves.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useNavigate } from 'react-router';

export default function HrDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalEmployees: '—',
    activeEmployees: '—',
    totalDepartments: '—',
    pendingLeaves: '—',
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    async function loadMetrics() {
      try {
        const [empRes, deptRes, pendingRes] = await Promise.all([
          employeeApi.list({ limit: 1 }),
          departmentApi.list(),
          getPendingApprovals().catch(() => ({ leaves: [] })),
        ]);
        if (isMounted) {
          setMetrics({
            totalEmployees: empRes.data.pagination?.total ?? '—',
            activeEmployees: empRes.data.pagination?.total ?? '—',
            totalDepartments: deptRes.data.data?.length ?? '—',
            pendingLeaves: pendingRes.leaves?.length ?? 0,
            loading: false,
          });
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
  }, []);

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
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Employees"
            value={metrics.totalEmployees}
            icon="bi-people-fill"
            color="primary"
            trend="Workforce directory"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Departments"
            value={metrics.totalDepartments}
            icon="bi-building"
            color="success"
            trend="Active divisions"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/leaves/requests')}>
          <StatCard
            title="Pending Leaves"
            value={metrics.pendingLeaves}
            icon="bi-calendar2-check"
            color="warning"
            trend="Awaiting review"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Today's Attendance"
            value="0%"
            icon="bi-clock-history"
            color="info"
            trend="Coming in Chapter 4"
          />
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
                <i className="bi bi-diagram-3-fill fs-4"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0">Departments</h6>
                <small className="text-muted">Organizational units</small>
              </div>
            </div>
            <p className="text-muted small mb-3">
              Configure department structures, department heads, and member assignments.
            </p>
            <button
              className="btn btn-outline-success btn-sm rounded-2 mt-auto"
              onClick={() => navigate('/departments')}
            >
              Manage Departments &rarr;
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
                <h6 className="fw-bold mb-0">Company Bulletins</h6>
                <small className="text-muted">News & notices</small>
              </div>
            </div>
            <p className="text-muted small mb-3">
              Broadcast organization-wide updates, holiday notices, and policy changes.
            </p>
            <button
              className="btn btn-outline-info btn-sm rounded-2 mt-auto"
              onClick={() => navigate('/announcements')}
            >
              View Bulletins &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
