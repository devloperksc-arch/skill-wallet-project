import React, { useState } from 'react';
import { decideLeave } from '../../api/leaves.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function LeaveDecisionModal({ show, leave, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [decision, setDecision] = useState(null); // 'approved' | 'rejected' | null
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!show || !leave) return null;

  const handleSubmit = async (chosenDecision) => {
    setError('');
    if (chosenDecision === 'rejected' && (!note || note.trim().length < 3)) {
      setError('Please provide a note/reason for rejection (min 3 characters).');
      return;
    }

    setLoading(true);
    try {
      await decideLeave(leave._id, {
        decision: chosenDecision,
        note: note.trim(),
      });
      showToast(`Leave request ${chosenDecision} successfully`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to ${chosenDecision} leave request`;
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
              <i className="bi bi-clipboard-check text-primary me-2"></i>
              Review Leave Request
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger py-2 small mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}

            {/* Requester Info */}
            <div className="card bg-light border-0 p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h6 className="fw-bold mb-0">{leave.user?.name || 'Employee'}</h6>
                  <span className="text-muted small">
                    {leave.user?.employeeCode} • {leave.user?.department?.name || 'Department'}
                  </span>
                </div>
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                  Pending Review
                </span>
              </div>

              <div className="row g-2 mt-2 pt-2 border-top small">
                <div className="col-6">
                  <span className="text-muted">Type:</span>{' '}
                  <span className="fw-semibold">{leave.leaveType?.name}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted">Duration:</span>{' '}
                  <span className="badge bg-primary">{leave.days} {leave.days === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="col-12">
                  <span className="text-muted">Dates:</span>{' '}
                  <span className="fw-semibold">{leave.startDate} to {leave.endDate}</span>
                  {leave.halfDay && <span className="badge bg-info-subtle text-info ms-2">Half Day</span>}
                </div>
                <div className="col-12 mt-2">
                  <span className="text-muted">Reason:</span>
                  <p className="mb-0 text-dark fst-italic mt-1 bg-white p-2 rounded border">
                    "{leave.reason}"
                  </p>
                </div>
              </div>
            </div>

            {/* Rejection Note field */}
            <div className="mb-2">
              <label className="form-label fw-semibold">
                Decision Note {decision === 'rejected' && <span className="text-danger">*</span>}
              </label>
              <textarea
                className={`form-control ${error && decision === 'rejected' ? 'is-invalid' : ''}`}
                rows="2"
                placeholder="Optional for approval, required for rejection..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="modal-footer border-top bg-light justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => {
                  setDecision('rejected');
                  handleSubmit('rejected');
                }}
                disabled={loading}
              >
                {loading && decision === 'rejected' ? 'Processing…' : 'Reject Request'}
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => {
                  setDecision('approved');
                  handleSubmit('approved');
                }}
                disabled={loading}
              >
                {loading && decision === 'approved' ? 'Processing…' : 'Approve Request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
