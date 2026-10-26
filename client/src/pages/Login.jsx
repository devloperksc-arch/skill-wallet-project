import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import FormField from '../components/FormField.jsx';
import Spinner from 'react-bootstrap/Spinner';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const executeLogin = async (loginEmail, loginPassword) => {
    if (!loginEmail || !loginPassword) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const user = await login(loginEmail, loginPassword);
      showToast(`Welcome back, ${user.name}!`, 'success');

      if (user.mustChangePassword) {
        navigate('/change-password', { replace: true });
        return;
      }

      // If redirected from a specific protected page, go there, else go to role dashboard
      if (from !== '/' && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        const rolePath = user.role === 'hr' ? '/hr' : user.role === 'manager' ? '/manager' : '/employee';
        navigate(rolePath, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    await executeLogin(demoEmail, demoPassword);
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Sign In</h4>
        <p className="text-muted small">Enter your credentials to access your dashboard</p>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small rounded-3" role="alert">
          <i className="bi bi-exclamation-circle-fill flex-shrink-0"></i>
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Email Address" required id="login-email">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0 text-muted">
              <i className="bi bi-envelope"></i>
            </span>
            <input
              type="email"
              id="email"
              className="form-control border-start-0"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              autoComplete="email"
              required
            />
          </div>
        </FormField>

        <FormField label="Password" required id="login-password">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0 text-muted">
              <i className="bi bi-lock"></i>
            </span>
            <input
              type="password"
              id="password"
              className="form-control border-start-0"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              autoComplete="current-password"
              required
            />
          </div>
        </FormField>

        <button
          type="submit"
          id="btn-login"
          className="btn btn-primary w-100 py-2 fw-semibold mt-2 rounded-3 shadow-sm"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* 1-Click Quick Demo Login */}
      <div className="mt-4 pt-3 border-top">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>
            ⚡ 1-CLICK INSTANT DEMO LOGIN:
          </span>
          <span className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>
            Passw0rd!23
          </span>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm py-2 px-2 rounded-2 fw-medium flex-fill d-flex align-items-center justify-content-center gap-1 shadow-sm"
            style={{ fontSize: '0.8rem' }}
            disabled={submitting}
            onClick={() => handleQuickLogin('hr@staffsync.test', 'Passw0rd!23')}
          >
            <i className="bi bi-shield-check text-primary"></i> HR Admin
          </button>
          <button
            type="button"
            className="btn btn-outline-info btn-sm py-2 px-2 rounded-2 fw-medium flex-fill d-flex align-items-center justify-content-center gap-1 shadow-sm"
            style={{ fontSize: '0.8rem' }}
            disabled={submitting}
            onClick={() => handleQuickLogin('manager@staffsync.test', 'Passw0rd!23')}
          >
            <i className="bi bi-briefcase text-info"></i> Manager
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm py-2 px-2 rounded-2 fw-medium flex-fill d-flex align-items-center justify-content-center gap-1 shadow-sm"
            style={{ fontSize: '0.8rem' }}
            disabled={submitting}
            onClick={() => handleQuickLogin('employee1@staffsync.test', 'Passw0rd!23')}
          >
            <i className="bi bi-person text-secondary"></i> Employee
          </button>
        </div>
      </div>
    </div>
  );
}
