import { Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div className="auth-wrapper min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="w-100" style={{ maxWidth: '440px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 p-3 shadow-sm mb-2" style={{ width: '48px', height: '48px' }}>
            <i className="bi bi-people-fill fs-4"></i>
          </div>
          <h3 className="fw-bold tracking-tight mb-1 text-dark">StaffSync</h3>
          <p className="text-muted small">Human Resource Management System</p>
        </div>
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div className="card-body p-4 p-sm-5">
            <Outlet />
          </div>
        </div>
        <div className="text-center mt-4">
          <p className="text-muted small mb-0">&copy; {new Date().getFullYear()} StaffSync HRM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
