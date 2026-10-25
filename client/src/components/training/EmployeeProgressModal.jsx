import React, { useState, useEffect } from 'react';
import { updateEnrollment } from '../../api/training.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function EmployeeProgressModal({ show, enrollment, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('in_progress');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && enrollment) {
      setError('');
      setProgress(enrollment.progress || 0);
      setStatus(enrollment.status || 'in_progress');
      setFeedback(enrollment.feedback || '');
    }
  }, [show, enrollment]);

  if (!show || !enrollment) return null;

  const handleProgressChange = (val) => {
    const num = Math.min(100, Math.max(0, Number(val)));
    setProgress(num);
    if (num === 100) {
      setStatus('completed');
    } else if (num > 0 && status === 'enrolled') {
      setStatus('in_progress');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      const payload = {
        progress: Number(progress),
        status,
        feedback: feedback.trim(),
      };

      await updateEnrollment(enrollment._id, payload);
      showToast('Training course progress updated', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to update progress');
    } finally {
      setLoading(false);
    }
  };

  const program = enrollment.program || {};

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-light border-bottom py-3">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-0">Update Learning Progress</h5>
              <small className="text-muted">{program.title || 'Course'}</small>
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

              {/* Progress Slider */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-semibold small text-dark mb-0">
                    Completion Progress:
                  </label>
                  <span className="badge bg-primary fs-6">{progress}%</span>
                </div>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => handleProgressChange(e.target.value)}
                />
                <div className="d-flex justify-content-between text-muted small">
                  <span>0% (Not Started)</span>
                  <span>50% (In Progress)</span>
                  <span>100% (Finished)</span>
                </div>
              </div>

              {/* Status Radio / Select */}
              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">Course Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => {
                    const next = e.target.value;
                    setStatus(next);
                    if (next === 'completed') setProgress(100);
                  }}
                >
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="dropped">Drop / Withdraw</option>
                </select>
              </div>

              {/* Course Feedback */}
              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">
                  Student Feedback & Notes
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Share feedback on the material, instructor, or what you learned..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer bg-light border-top py-2 px-4">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm"></span>}
                <span>Save Progress</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
