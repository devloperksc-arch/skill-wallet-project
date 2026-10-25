import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    if (!user) {
      navigate('/login');
    } else {
      const rolePath = user.role === 'hr' ? '/hr' : user.role === 'manager' ? '/manager' : '/employee';
      navigate(rolePath);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-75 py-5 text-center">
      <div className="p-4" style={{ maxWidth: '480px' }}>
        <div className="text-muted mb-3">
          <i className="bi bi-question-diamond" style={{ fontSize: '4rem' }}></i>
        </div>
        <h2 className="fw-bold mb-2">404 — Page Not Found</h2>
        <p className="text-muted mb-4">
          The page you are looking for does not exist or has been moved.
        </p>
        <button className="btn btn-primary px-4 py-2 rounded-3 shadow-sm" onClick={handleBack}>
          <i className="bi bi-arrow-left me-2"></i> Return Home
        </button>
      </div>
    </div>
  );
}
