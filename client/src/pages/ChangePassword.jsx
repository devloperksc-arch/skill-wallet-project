import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authApi } from '../api/auth.js';
import FormField from '../components/FormField.jsx';
import Spinner from 'react-bootstrap/Spinner';

export default function ChangePassword() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter.';
    if (!/\d/.test(pwd)) return 'Password must contain at least one number.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    const policyError = validatePassword(newPassword);
    if (policyError) {
      setError(policyError);
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      updateUser({ mustChangePassword: false });
      showToast('Password changed successfully!', 'success');

      const rolePath = user?.role === 'hr' ? '/hr' : user?.role === 'manager' ? '/manager' : '/employee';
      navigate(rolePath, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to change password.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Change Password</h4>
        <p className="text-muted small">
          {user?.mustChangePassword
            ? 'You must change your temporary password before continuing.'
            : 'Update your account password regularly for enhanced security.'}
        </p>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small rounded-3" role="alert">
          <i className="bi bi-exclamation-circle-fill flex-shrink-0"></i>
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Current Password" required id="current-password">
          <input
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </FormField>

        <FormField
          label="New Password"
          required
          id="new-password"
          helperText="Min 8 characters with at least 1 uppercase, 1 lowercase, and 1 number."
        >
          <input
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </FormField>

        <FormField label="Confirm New Password" required id="confirm-password">
          <input
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
            required
          />
        </FormField>

        <div className="d-flex gap-2 mt-4">
          {!user?.mustChangePassword && (
            <button
              type="button"
              className="btn btn-outline-secondary w-50 py-2 rounded-3"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={`btn btn-primary ${user?.mustChangePassword ? 'w-100' : 'w-50'} py-2 fw-semibold rounded-3 shadow-sm`}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Updating...
              </>
            ) : (
              'Save Password'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
