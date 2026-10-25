import React, { useState, useEffect } from 'react';
import { correctAttendance, createMissingAttendance } from '../../api/attendance.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AttendanceCorrectionModal({
  show,
  attendance,
  isNewMissing = false,
  employees = [],
  onClose,
  onSuccess,
}) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'present',
    correctionReason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setError('');
      if (attendance && !isNewMissing) {
        setFormData({
          userId: attendance.user?._id || attendance.user || '',
          date: attendance.date,
          checkIn: attendance.checkIn ? new Date(attendance.checkIn).toISOString().slice(0, 16) : '',
          checkOut: attendance.checkOut ? new Date(attendance.checkOut).toISOString().slice(0, 16) : '',
          status: attendance.status || 'present',
          correctionReason: '',
        });
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setFormData({
          userId: employees.length > 0 ? employees[0]._id : '',
          date: todayStr,
          checkIn: `${todayStr}T09:30`,
          checkOut: `${todayStr}T18:00`,
          status: 'present',
          correctionReason: '',
        });
      }
    }
  }, [show, attendance, isNewMissing, employees]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.correctionReason || formData.correctionReason.trim().length < 3) {
      setError('Please provide a correction reason (minimum 3 characters).');
      return;
    }

    setLoading(true);
    try {
      if (isNewMissing) {
        await createMissingAttendance({
          userId: formData.userId,
          date: formData.date,
          checkIn: new Date(formData.checkIn).toISOString(),
          checkOut: formData.checkOut ? new Date(formData.checkOut).toISOString() : null,
          status: formData.status,
          correctionReason: formData.correctionReason.trim(),
        });
        showToast('Missing attendance record created successfully', 'success');
      } else {
        await correctAttendance(attendance._id, {
          checkIn: formData.checkIn ? new Date(formData.checkIn).toISOString() : undefined,
          checkOut: formData.checkOut ? new Date(formData.checkOut).toISOString() : null,
          status: formData.status,
          correctionReason: formData.correctionReason.trim(),
        });
        showToast('Attendance record corrected successfully', 'success');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update attendance';
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
              <i className="bi bi-pencil-square text-primary me-2"></i>
              {isNewMissing ? 'Log Missing Attendance' : 'Correct Attendance Record'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>
                  {error}
                </div>
              )}

              {/* Employee info or select */}
              {isNewMissing ? (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Employee</label>
                  <select
                    className="form-select"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-light p-3 rounded mb-3">
                  <div className="fw-semibold text-dark">{attendance?.user?.name || 'Employee'}</div>
                  <div className="text-muted small">
                    {attendance?.user?.employeeCode} • Date: <strong>{attendance?.date}</strong>
                  </div>
                </div>
              )}

              {/* Date (editable only if new) */}
              {isNewMissing && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* Time inputs */}
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label fw-semibold">Check In (Date & Time)</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold">Check Out (Date & Time)</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  />
                </div>
              </div>

              {/* Status Select */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="present">Present</option>
                  <option value="half-day">Half Day</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              {/* Correction Reason */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Correction Reason <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="e.g. Employee forgot to badge out; badge reader malfunction..."
                  value={formData.correctionReason}
                  onChange={(e) => setFormData({ ...formData, correctionReason: e.target.value })}
                  required
                  minLength={3}
                ></textarea>
              </div>

              {/* Existing History Audit trail */}
              {attendance?.history?.length > 0 && (
                <div className="border-top pt-3 mt-3">
                  <span className="fw-semibold small text-muted d-block mb-2">Previous Audit Trail:</span>
                  <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '120px' }}>
                    {attendance.history.map((h, i) => (
                      <div key={i} className="bg-light p-2 rounded small border">
                        <div className="d-flex justify-content-between text-muted">
                          <span>Status: <strong>{h.status}</strong></span>
                          <span>{new Date(h.correctedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-dark fst-italic mt-1">"{h.correctionReason}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer border-top bg-light">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save Correction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
