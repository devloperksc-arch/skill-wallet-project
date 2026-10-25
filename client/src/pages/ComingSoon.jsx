import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';

export default function ComingSoon({ title: explicitTitle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Extract a readable module name from pathname if not provided
  const moduleName =
    explicitTitle ||
    location.pathname
      .replace(/^\//, '')
      .split('/')
      .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
      .join(' ') ||
    'Module';

  const handleBack = () => {
    const rolePath = user?.role === 'hr' ? '/hr' : user?.role === 'manager' ? '/manager' : '/employee';
    navigate(rolePath);
  };

  return (
    <div>
      <PageHeader
        title={moduleName}
        breadcrumb={[
          { label: 'Dashboard', path: '/' },
          { label: moduleName, active: true },
        ]}
      />

      <div className="card border-0 shadow-sm rounded-4 p-5 text-center mt-3">
        <div className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
          <i className="bi bi-tools fs-1"></i>
        </div>
        <h4 className="fw-bold mb-2">{moduleName} is Coming Soon</h4>
        <p className="text-muted mx-auto mb-4" style={{ maxWidth: '440px' }}>
          This module is part of the next chapter in the StaffSync build plan. You can explore the current chapter features or return to your dashboard.
        </p>
        <div>
          <button className="btn btn-outline-primary px-4 py-2 rounded-3" onClick={handleBack}>
            <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
