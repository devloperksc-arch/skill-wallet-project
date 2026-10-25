import React, { useState, useEffect } from 'react';
import { enrollEmployees } from '../../api/training.js';
import { employeeApi } from '../../api/employees.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function EnrollEmployeesModal({
  show,
  program,
  existingEnrollments = [],
  onClose,
  onSuccess,
}) {
  const { showToast } = useToast();
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTeam, setFetchingTeam] = useState(false);
  const [error, setError] = useState('');

  const enrolledUserIds = new Set(
    existingEnrollments
      .filter((e) => e.status !== 'dropped')
      .map((e) => (e.user?._id || e.user).toString())
  );

  const currentEnrolledCount = enrolledUserIds.size;
  const capacity = program?.capacity || 0;
  const remainingSeats = Math.max(0, capacity - currentEnrolledCount);

  useEffect(() => {
    if (show) {
      setSelectedUserIds([]);
      setError('');
      const fetchTeam = async () => {
        try {
          setFetchingTeam(true);
          const res = await employeeApi.getTeam();
          setTeamMembers(res.data?.data || []);
        } catch (err) {
          console.error(err);
          setError('Failed to load direct reports team list.');
        } finally {
          setFetchingTeam(false);
        }
      };
      fetchTeam();
    }
  }, [show]);

  if (!show || !program) return null;

  const toggleSelect = (userId) => {
    if (enrolledUserIds.has(userId)) return;
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      if (selectedUserIds.length >= remainingSeats) {
        setError(`Cannot select more than ${remainingSeats} employees. Program capacity is reached.`);
        return;
      }
      setError('');
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSelectAllAvailable = () => {
    const available = teamMembers
      .filter((m) => !enrolledUserIds.has(m._id.toString()))
      .map((m) => m._id.toString())
      .slice(0, remainingSeats);
    setSelectedUserIds(available);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      setError('Please select at least one employee to enroll.');
      return;
    }

    setLoading(true);
    try {
      await enrollEmployees(program._id, selectedUserIds);
      showToast(`Successfully enrolled ${selectedUserIds.length} team member(s)`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-light border-bottom py-3">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-0">Enroll Team Members</h5>
              <small className="text-muted">{program.title}</small>
            </div>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <div className="modal-body p-4">
            {/* Capacity Meter Banner */}
            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-semibold text-dark">Enrollment Capacity</span>
                <span className="badge bg-primary">
                  {currentEnrolledCount + selectedUserIds.length} / {capacity} Seats Filled
                </span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${Math.min(100, (currentEnrolledCount / capacity) * 100)}%` }}
                ></div>
                <div
                  className="progress-bar bg-primary"
                  role="progressbar"
                  style={{ width: `${Math.min(100, (selectedUserIds.length / capacity) * 100)}%` }}
                ></div>
              </div>
              <div className="d-flex justify-content-between small text-muted mt-1">
                <span>{remainingSeats} seats available</span>
                <span>{selectedUserIds.length} selected</span>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            )}

            {fetchingTeam ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                Loading direct reports...
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-4 text-muted">
                No active direct reports found for your account.
              </div>
            ) : (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted fw-semibold">Direct Reports</span>
                  {remainingSeats > 0 && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none"
                      onClick={handleSelectAllAvailable}
                    >
                      Select Available (up to {remainingSeats})
                    </button>
                  )}
                </div>

                <div className="list-group">
                  {teamMembers.map((member) => {
                    const isEnrolled = enrolledUserIds.has(member._id.toString());
                    const isSelected = selectedUserIds.includes(member._id.toString());
                    return (
                      <label
                        key={member._id}
                        className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 ${
                          isEnrolled ? 'bg-light text-muted' : ''
                        }`}
                        style={{ cursor: isEnrolled ? 'default' : 'pointer' }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <input
                            type="checkbox"
                            className="form-check-input mt-0"
                            checked={isSelected || isEnrolled}
                            disabled={isEnrolled}
                            onChange={() => toggleSelect(member._id.toString())}
                          />
                          <div>
                            <div className="fw-semibold text-dark">{member.name}</div>
                            <div className="small text-muted">
                              {member.employeeCode} &bull; {member.designation || 'Staff'}
                            </div>
                          </div>
                        </div>

                        {isEnrolled && (
                          <span className="badge bg-secondary-subtle text-secondary small">
                            Already Enrolled
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer bg-light border-top py-2 px-4">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              disabled={loading || selectedUserIds.length === 0}
              onClick={handleSubmit}
            >
              {loading && <span className="spinner-border spinner-border-sm"></span>}
              <span>Enroll Selected ({selectedUserIds.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
