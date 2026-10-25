import React, { useState, useEffect } from 'react';
import { previewLeave, applyLeave } from '../../api/leaves.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function ApplyLeaveModal({ show, onClose, onSuccess, balances = [] }) {
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();

  // Helper date strings
  const today = new Date().toISOString().split('T')[0];
  const minDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const maxDate = `${currentYear}-12-31`;

  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    halfDay: false,
    reason: '',
  });

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      const defaultType = balances.length > 0 ? balances[0].leaveType?._id || '' : '';
      setFormData({
        leaveType: defaultType,
        startDate: '',
        endDate: '',
        halfDay: false,
        reason: '',
      });
      setPreview(null);
      setPreviewError('');
      setErrors({});
    }
  }, [show, balances]);

  // Handle live preview calculation
  useEffect(() => {
    if (!formData.startDate || !formData.endDate) {
      setPreview(null);
      setPreviewError('');
      return;
    }

    if (formData.endDate < formData.startDate) {
      setPreview(null);
      setPreviewError('End date must be greater than or equal to start date');
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError('');
      try {
        const res = await previewLeave({
          startDate: formData.startDate,
          endDate: formData.endDate,
          halfDay: formData.halfDay,
        });
        setPreview(res);
      } catch (err) {
        setPreview(null);
        setPreviewError(err.response?.data?.message || 'Failed to preview working days');
      } finally {
        setPreviewLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [formData.startDate, formData.endDate, formData.halfDay]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      // If dates don't match, disable halfDay automatically
      if (name === 'startDate' || name === 'endDate') {
        if (next.startDate !== next.endDate) {
          next.halfDay = false;
        }
      }
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      await applyLeave(formData);
      showToast('Leave request submitted successfully', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit leave request';
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors) {
        setErrors(fieldErrors);
      } else {
        setErrors({ general: msg });
      }
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const isSingleDay = formData.startDate && formData.startDate === formData.endDate;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header border-bottom">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-calendar-plus text-primary me-2"></i>
              Apply for Leave
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {errors.general && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errors.general}
                </div>
              )}

              {/* Leave Type Select */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Leave Type</label>
                <select
                  name="leaveType"
                  className={`form-select ${errors.leaveType ? 'is-invalid' : ''}`}
                  value={formData.leaveType}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select Leave Type</option>
                  {balances.map((b) => {
                    const lt = b.leaveType || {};
                    const avail = lt.isUnlimited ? 'Unlimited' : Math.max(0, b.allocated - b.used - b.pending);
                    return (
                      <option key={b._id} value={lt._id}>
                        {lt.name} (Available: {avail} {lt.isUnlimited ? '' : 'days'})
                      </option>
                    );
                  })}
                </select>
                {errors.leaveType && <div className="invalid-feedback">{errors.leaveType}</div>}
              </div>

              {/* Date pickers */}
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label fw-semibold">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                    value={formData.startDate}
                    min={minDate}
                    max={maxDate}
                    onChange={handleChange}
                    required
                  />
                  {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                    value={formData.endDate}
                    min={formData.startDate || minDate}
                    max={maxDate}
                    onChange={handleChange}
                    required
                  />
                  {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                </div>
              </div>

              {/* Half Day Checkbox (only when single day) */}
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  id="halfDayCheck"
                  name="halfDay"
                  className="form-check-input"
                  checked={formData.halfDay}
                  onChange={handleChange}
                  disabled={!isSingleDay}
                />
                <label
                  htmlFor="halfDayCheck"
                  className={`form-check-label ${!isSingleDay ? 'text-muted' : ''}`}
                >
                  Half-day leave {!isSingleDay && <span className="small">(available only for single-day)</span>}
                </label>
              </div>

              {/* Live Preview Card */}
              {previewLoading && (
                <div className="alert alert-light border py-2 text-center text-muted small mb-3">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  Calculating working days…
                </div>
              )}

              {previewError && (
                <div className="alert alert-warning py-2 small mb-3">
                  <i className="bi bi-info-circle me-1"></i>
                  {previewError}
                </div>
              )}

              {preview && !previewLoading && (
                <div className="alert alert-primary-subtle border-primary-subtle py-2 px-3 small mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">
                      <i className="bi bi-calendar-check me-1 text-primary"></i>
                      Deducted days:
                    </span>
                    <span className="badge bg-primary fs-6">{preview.days} {preview.days === 1 ? 'day' : 'days'}</span>
                  </div>
                  {(preview.holidaysInRange > 0 || preview.weekendsInRange > 0) && (
                    <div className="text-muted mt-1 small">
                      Excludes {preview.weekendsInRange > 0 ? `${preview.weekendsInRange} weekend day(s)` : ''}
                      {preview.weekendsInRange > 0 && preview.holidaysInRange > 0 ? ' & ' : ''}
                      {preview.holidaysInRange > 0 ? `${preview.holidaysInRange} official holiday(s)` : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div className="mb-2">
                <label className="form-label fw-semibold">Reason (min 5 chars)</label>
                <textarea
                  name="reason"
                  rows="3"
                  className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
                  placeholder="Provide context or reason for this leave request..."
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  minLength={5}
                ></textarea>
                {errors.reason && <div className="invalid-feedback">{errors.reason}</div>}
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (preview && preview.days === 0) || !!previewError}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Submitting…
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
