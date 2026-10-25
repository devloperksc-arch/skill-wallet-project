import React, { useState, useEffect, useCallback } from 'react';
import { getMyEnrollments } from '../../api/training.js';
import EmployeeProgressModal from '../../components/training/EmployeeProgressModal.jsx';

export default function EmployeeTraining() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyEnrollments();
      setEnrollments(data || []);
    } catch (err) {
      console.error('Failed to load my enrollments', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleOpenProgress = (enr) => {
    setSelectedEnrollment(enr);
    setProgressModalOpen(true);
  };

  const getStatusBadge = (status) => {
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
    <div className="container-fluid py-4" style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">My Training Courses</h2>
        <p className="text-secondary small mb-0">
          Track your enrolled professional development courses, update learning progress, and submit course feedback
        </p>
      </div>

      {loading ? (
        <div className="card shadow-sm border-0 p-5 text-center text-muted">
          <div className="spinner-border spinner-border-sm text-primary me-2"></div>
          Loading your training courses...
        </div>
      ) : enrollments.length === 0 ? (
        <div className="card shadow-sm border-0 p-5 text-center text-muted">
          <i className="bi bi-mortarboard fs-1 text-secondary mb-3 d-block opacity-50"></i>
          <h5 className="fw-bold text-dark">No Enrolled Trainings</h5>
          <p className="text-secondary small mb-0">
            You are not currently enrolled in any training programs. Your manager will assign relevant courses to your learning plan.
          </p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {enrollments.map((enr) => {
            const program = enr.program || {};
            const isCompleted = enr.status === 'completed';

            return (
              <div key={enr._id} className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="card-body p-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                    <div>
                      <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
                        {getStatusBadge(enr.status)}
                        <span className="badge bg-primary-subtle text-primary border text-capitalize">
                          {program.type?.replace('_', ' ')}
                        </span>
                        <span className="badge bg-light text-secondary border text-capitalize">
                          {program.mode}
                        </span>
                      </div>
                      <h5 className="fw-bold text-dark mb-1">{program.title}</h5>
                    </div>

                    <button
                      className="btn btn-outline-primary btn-sm rounded-3 d-flex align-items-center gap-1"
                      onClick={() => handleOpenProgress(enr)}
                    >
                      <i className="bi bi-sliders"></i>
                      <span>Update Progress</span>
                    </button>
                  </div>

                  <p className="text-secondary small mb-3">{program.description}</p>

                  {/* Metadata Row */}
                  <div className="row g-2 mb-3 small text-muted">
                    <div className="col-12 col-sm-6 col-md-4">
                      <i className="bi bi-person-badge text-primary me-2"></i>
                      <span>Instructor: <strong>{program.trainer || 'Internal'}</strong></span>
                    </div>
                    <div className="col-12 col-sm-6 col-md-4">
                      <i className="bi bi-geo-alt text-primary me-2"></i>
                      <span>Location: <strong>{program.location || 'Remote'}</strong></span>
                    </div>
                    <div className="col-12 col-sm-6 col-md-4">
                      <i className="bi bi-calendar-event text-primary me-2"></i>
                      <span>
                        {new Date(program.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} –{' '}
                        {new Date(program.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Progress & Evaluation Section */}
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small fw-semibold text-dark">Course Completion</span>
                      <span className="fw-bold text-primary">{enr.progress || 0}%</span>
                    </div>
                    <div className="progress mb-2" style={{ height: '8px' }}>
                      <div
                        className={`progress-bar ${isCompleted ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${enr.progress || 0}%` }}
                      ></div>
                    </div>

                    {/* Scores & Feedback */}
                    <div className="d-flex flex-wrap justify-content-between gap-2 mt-2 pt-2 border-top small">
                      <div>
                        <span className="text-muted me-1">Grade / Score:</span>
                        {enr.score != null ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold">
                            {enr.score} / 100
                          </span>
                        ) : (
                          <span className="text-muted">Pending Evaluation</span>
                        )}
                      </div>

                      {enr.managerNote && (
                        <div>
                          <span className="text-muted me-1">Manager Note:</span>
                          <span className="text-dark fw-medium">"{enr.managerNote}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Modal */}
      <EmployeeProgressModal
        show={progressModalOpen}
        enrollment={selectedEnrollment}
        onClose={() => setProgressModalOpen(false)}
        onSuccess={fetchEnrollments}
      />
    </div>
  );
}
