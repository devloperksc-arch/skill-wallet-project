import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getProgramById, dropEnrollment } from '../../api/training.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import EnrollEmployeesModal from '../../components/training/EnrollEmployeesModal.jsx';
import ScoreModal from '../../components/training/ScoreModal.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';

export default function TrainingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const [dropConfirmOpen, setDropConfirmOpen] = useState(false);
  const [droppingUserId, setDroppingUserId] = useState(null);
  const [dropLoading, setDropLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProgramById(id);
      setData(res);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to load program', 'danger');
      navigate('/trainings');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center text-muted">
        <div className="spinner-border text-primary me-2"></div>
        Loading program details...
      </div>
    );
  }

  if (!data?.program) return null;

  const { program, enrollments = [], enrolledCount = 0 } = data;
  const isManagerOwner =
    user.role === 'manager' && program.createdBy?._id?.toString() === user._id.toString();
  const isHr = user.role === 'hr';
  const canManageEnrollments = isManagerOwner && program.status !== 'completed' && program.status !== 'cancelled';

  const handlePromptDrop = (userId) => {
    setDroppingUserId(userId);
    setDropConfirmOpen(true);
  };

  const handleConfirmDrop = async () => {
    if (!droppingUserId) return;
    setDropLoading(true);
    try {
      await dropEnrollment(program._id, droppingUserId);
      showToast('Enrollment updated successfully', 'success');
      setDropConfirmOpen(false);
      setDroppingUserId(null);
      fetchDetail();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to modify enrollment', 'danger');
    } finally {
      setDropLoading(false);
    }
  };

  const handleOpenScore = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setScoreModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="badge bg-secondary-subtle text-secondary border">Draft</span>;
      case 'scheduled':
        return <span className="badge bg-info-subtle text-info border border-info-subtle">Scheduled</span>;
      case 'ongoing':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Ongoing</span>;
      case 'completed':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">Completed</span>;
      case 'cancelled':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Cancelled</span>;
      default:
        return <span className="badge bg-light text-dark border">{status}</span>;
    }
  };

  const getEnrollmentStatusBadge = (status) => {
    switch (status) {
      case 'enrolled':
        return <span className="badge bg-info-subtle text-info border border-info-subtle">Enrolled</span>;
      case 'in_progress':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">In Progress</span>;
      case 'completed':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">Completed</span>;
      case 'dropped':
        return <span className="badge bg-secondary-subtle text-secondary border">Dropped</span>;
      default:
        return <span className="badge bg-light text-dark border">{status}</span>;
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Back button */}
      <button className="btn btn-outline-secondary btn-sm mb-3" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left me-1"></i> Back to Programs
      </button>

      {/* Program Header Banner */}
      <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                {getStatusBadge(program.status)}
                <span className="badge bg-primary-subtle text-primary border text-capitalize">
                  {program.type?.replace('_', ' ')}
                </span>
                <span className="badge bg-light text-secondary border text-capitalize">
                  {program.mode}
                </span>
              </div>
              <h2 className="fw-bold text-dark mb-2">{program.title}</h2>
              <p className="text-secondary mb-3" style={{ maxWidth: '800px', whiteSpace: 'pre-line' }}>
                {program.description}
              </p>
            </div>

            {canManageEnrollments && (
              <button
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={() => setEnrollModalOpen(true)}
              >
                <i className="bi bi-person-plus-fill"></i>
                <span>Enroll Team Members</span>
              </button>
            )}
          </div>

          <div className="row g-3 pt-3 border-top small text-secondary">
            <div className="col-6 col-md-3">
              <span className="text-muted d-block">Trainer / Instructor</span>
              <strong className="text-dark">{program.trainer || 'Internal Instructor'}</strong>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted d-block">Location / Medium</span>
              <strong className="text-dark">{program.location || 'Remote'}</strong>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted d-block">Schedule</span>
              <strong className="text-dark">
                {new Date(program.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} –{' '}
                {new Date(program.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </strong>
            </div>
            <div className="col-6 col-md-3">
              <span className="text-muted d-block">Capacity</span>
              <strong className="text-dark">
                {enrolledCount} / {program.capacity} Seats ({Math.min(100, Math.round((enrolledCount / program.capacity) * 100))}%)
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollments & Roster Panel */}
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-people text-primary fs-5"></i>
            <h5 className="fw-bold text-dark mb-0">Enrolled Participants ({enrollments.length})</h5>
          </div>
          <span className="badge bg-light text-muted border">
            {enrollments.filter((e) => e.status === 'completed').length} Completed
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small text-uppercase">
              <tr>
                <th className="ps-4">Employee</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Score</th>
                <th>Student Feedback</th>
                <th>Manager Note</th>
                {(isManagerOwner || isHr) && <th className="pe-4 text-end">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No participants enrolled in this training program yet.
                  </td>
                </tr>
              ) : (
                enrollments.map((enr) => (
                  <tr key={enr._id}>
                    <td className="ps-4">
                      <div className="fw-semibold text-dark">{enr.user?.name || 'Participant'}</div>
                      <div className="small text-muted">
                        {enr.user?.employeeCode || enr.user?.email}
                      </div>
                    </td>
                    <td>{getEnrollmentStatusBadge(enr.status)}</td>
                    <td style={{ minWidth: '130px' }}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: '6px' }}>
                          <div
                            className={`progress-bar ${enr.progress === 100 ? 'bg-success' : 'bg-primary'}`}
                            style={{ width: `${enr.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="small fw-semibold text-dark">{enr.progress || 0}%</span>
                      </div>
                    </td>
                    <td>
                      {enr.score != null ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold">
                          {enr.score} / 100
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="small text-secondary text-truncate" style={{ maxWidth: '180px' }}>
                      {enr.feedback || <span className="text-muted fst-italic">No feedback</span>}
                    </td>
                    <td className="small text-secondary text-truncate" style={{ maxWidth: '180px' }}>
                      {enr.managerNote || <span className="text-muted fst-italic">No note</span>}
                    </td>
                    {(isManagerOwner || isHr) && (
                      <td className="pe-4 text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            title="Record Score / Feedback"
                            onClick={() => handleOpenScore(enr)}
                          >
                            <i className="bi bi-clipboard2-check me-1"></i> Grade
                          </button>
                          {isManagerOwner && enr.status !== 'dropped' && (
                            <button
                              className="btn btn-outline-danger"
                              title="Drop / Remove"
                              onClick={() => handlePromptDrop(enr.user?._id || enr.user)}
                            >
                              <i className="bi bi-x-circle"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll Modal */}
      <EnrollEmployeesModal
        show={enrollModalOpen}
        program={program}
        existingEnrollments={enrollments}
        onClose={() => setEnrollModalOpen(false)}
        onSuccess={fetchDetail}
      />

      {/* Score Modal */}
      <ScoreModal
        show={scoreModalOpen}
        enrollment={selectedEnrollment}
        onClose={() => setScoreModalOpen(false)}
        onSuccess={fetchDetail}
      />

      {/* Drop Confirm Modal */}
      <ConfirmModal
        show={dropConfirmOpen}
        title="Drop Enrollment"
        message="Are you sure you want to drop/remove this employee from the training program?"
        confirmText="Confirm Drop"
        variant="danger"
        loading={dropLoading}
        onCancel={() => setDropConfirmOpen(false)}
        onConfirm={handleConfirmDrop}
      />
    </div>
  );
}
