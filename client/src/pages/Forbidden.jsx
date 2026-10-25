import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';

export default function Forbidden() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    const rolePath = user?.role === 'hr' ? '/hr' : user?.role === 'manager' ? '/manager' : '/employee';
    navigate(rolePath);
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-75 py-5 text-center">
      <div className="p-4" style={{ maxWidth: '480px' }}>
        <div className="text-warning mb-3">
          <i className="bi bi-shield-lock-fill" style={{ fontSize: '4rem' }}></i>
        </div>
        <h2 className="fw-bold mb-2">403 — Access Denied</h2>
        <p className="text-muted mb-4">
          You do not have permission to access this page. This area is restricted based on your account role.
        </p>
        <button className="btn btn-primary px-4 py-2 rounded-3 shadow-sm" onClick={handleBack}>
          <i className="bi bi-arrow-left me-2"></i> Return to Dashboard
        </button>
      </div>
    </div>
  );
}
