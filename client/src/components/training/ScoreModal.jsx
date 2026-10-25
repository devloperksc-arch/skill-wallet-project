import React, { useState, useEffect } from 'react';
import { updateEnrollment } from '../../api/training.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function ScoreModal({ show, enrollment, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [score, setScore] = useState('');
  const [managerNote, setManagerNote] = useState('');
  const [markComplete, setMarkComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && enrollment) {
      setError('');
      setScore(enrollment.score != null ? enrollment.score : '');
      setManagerNote(enrollment.managerNote || '');
      setMarkComplete(enrollment.status === 'completed');
    }
  }, [show, enrollment]);

  if (!show || !enrollment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericScore = score !== '' ? Number(score) : null;
    if (numericScore != null && (numericScore < 0 || numericScore > 100)) {
      setError('Score must be a number between 0 and 100.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        score: numericScore,
        managerNote: managerNote.trim(),
        status: markComplete ? 'completed' : enrollment.status,
      };

      await updateEnrollment(enrollment._id, payload);
      showToast('Enrollment evaluation updated successfully', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to update score');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-light border-bottom py-3">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-0">Record Score & Evaluation</h5>
              <small className="text-muted">
                Student: <strong>{enrollment.user?.name}</strong>
              </small>
            </div>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{error}</span>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">
                  Assessment Score (0 – 100)
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    placeholder="e.g. 85"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                  />
                  <span className="input-group-text bg-light">/ 100</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">
                  Manager Feedback & Evaluation Notes
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Notes on performance, practical exam results, or project completion..."
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                ></textarea>
              </div>

              <div className="form-check form-switch p-0 ps-5 mt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="completeSwitch"
                  checked={markComplete}
                  onChange={(e) => setMarkComplete(e.target.checked)}
                />
                <label className="form-check-label fw-semibold small" htmlFor="completeSwitch">
                  Mark this training enrollment as Officially Completed
                </label>
              </div>
            </div>

            <div className="modal-footer bg-light border-top py-2 px-4">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm"></span>}
                <span>Save Evaluation</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
