import React, { useState, useEffect } from 'react';
import { adjustBalance } from '../../api/leaves.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdjustBalanceModal({ show, balance, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [allocated, setAllocated] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (balance) {
      setAllocated(balance.allocated ?? 0);
      setReason('');
      setError('');
    }
  }, [balance]);

  if (!show || !balance) return null;

  const minAllowed = (balance.used || 0) + (balance.pending || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (allocated < minAllowed) {
      setError(`Allocated days cannot be less than already used (${balance.used}) + pending (${balance.pending}) days`);
      return;
    }

    if (!reason || reason.trim().length < 3) {
      setError('Please provide a reason for the adjustment (min 3 characters).');
      return;
    }

    setLoading(true);
    try {
      await adjustBalance(balance._id, {
        allocated: Number(allocated),
        reason: reason.trim(),
      });
      showToast('Leave balance adjusted successfully', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to adjust balance';
      setError(msg);
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header border-bottom">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-sliders text-primary me-2"></i>
              Adjust Leave Quota
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <div className="bg-light p-3 rounded mb-3">
                <div className="fw-semibold text-dark">{balance.leaveType?.name || 'Leave Type'}</div>
                <div className="d-flex gap-3 text-muted small mt-1">
                  <span>Current: <strong>{balance.allocated}</strong></span>
                  <span>Used: <strong>{balance.used}</strong></span>
                  <span>Pending: <strong>{balance.pending}</strong></span>
                  <span>Min Allowed: <strong className="text-danger">{minAllowed}</strong></span>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">New Allocated Quota (days)</label>
                <input
                  type="number"
                  step="0.5"
                  min={minAllowed}
                  className="form-control"
                  value={allocated}
                  onChange={(e) => setAllocated(e.target.value)}
                  required
                />
                <div className="form-text small">
                  Cannot be less than {minAllowed} (used + pending).
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold">Reason for Adjustment</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="e.g. Annual policy incentive bonus, carryover adjustment..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  minLength={3}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving…' : 'Save Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
