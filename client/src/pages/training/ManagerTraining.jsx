import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getPrograms, deleteProgram, updateProgramStatus } from '../../api/training.js';
import TrainingProgramModal from '../../components/training/TrainingProgramModal.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function ManagerTraining() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter || undefined,
        page,
        limit: 12,
      };
      const res = await getPrograms(params);
      setPrograms(res.programs || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load training programs', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleOpenCreate = () => {
    setSelectedProgram(null);
    setProgramModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setSelectedProgram(p);
    setProgramModalOpen(true);
  };

  const handlePromptDelete = (id) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await deleteProgram(deletingId);
      showToast('Training program deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      fetchPrograms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete program', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTransitionStatus = async (id, nextStatus) => {
    try {
      await updateProgramStatus(id, nextStatus);
      showToast(`Program status updated to '${nextStatus}'`, 'success');
      fetchPrograms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Status transition failed', 'danger');
    }
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

  const getTypeBadge = (type) => {
    switch (type) {
      case 'technical':
        return <span className="badge bg-primary-subtle text-primary border">Technical</span>;
      case 'soft_skills':
        return <span className="badge bg-info-subtle text-info border">Soft Skills</span>;
      case 'compliance':
        return <span className="badge bg-danger-subtle text-danger border">Compliance</span>;
      case 'leadership':
        return <span className="badge bg-purple-subtle text-purple border" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}>Leadership</span>;
      default:
        return <span className="badge bg-light text-dark border">{type}</span>;
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Team Training Programs</h2>
          <p className="text-secondary small mb-0">
            Create professional development workshops, enroll direct reports, and monitor completion progress
          </p>
        </div>

        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenCreate}>
          <i className="bi bi-mortarboard-fill"></i>
          <span>Create Program</span>
        </button>
      </div>

      {/* Status Filter Chips */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button
          className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => {
            setStatusFilter('');
            setPage(1);
          }}
        >
          All Programs ({total})
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'draft' ? 'btn-secondary' : 'btn-outline-secondary'}`}
          onClick={() => {
            setStatusFilter('draft');
            setPage(1);
          }}
        >
          Draft
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'scheduled' ? 'btn-info text-white' : 'btn-outline-info'}`}
          onClick={() => {
            setStatusFilter('scheduled');
            setPage(1);
          }}
        >
          Scheduled
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'ongoing' ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
          onClick={() => {
            setStatusFilter('ongoing');
            setPage(1);
          }}
        >
          Ongoing
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'completed' ? 'btn-success' : 'btn-outline-success'}`}
          onClick={() => {
            setStatusFilter('completed');
            setPage(1);
          }}
        >
          Completed
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'cancelled' ? 'btn-danger' : 'btn-outline-danger'}`}
          onClick={() => {
            setStatusFilter('cancelled');
            setPage(1);
          }}
        >
          Cancelled
        </button>
      </div>

      {/* Program Grid */}
      {loading ? (
        <div className="card shadow-sm border-0 p-5 text-center text-muted">
          <div className="spinner-border spinner-border-sm text-primary me-2"></div>
          Loading training programs...
        </div>
      ) : programs.length === 0 ? (
        <div className="card shadow-sm border-0 p-5 text-center text-muted">
          <i className="bi bi-mortarboard fs-1 text-secondary mb-3 d-block opacity-50"></i>
          <h5 className="fw-bold text-dark">No Training Programs Found</h5>
          <p className="text-secondary small mb-3">
            You have not created any training programs in this status category yet.
          </p>
          <button className="btn btn-primary btn-sm mx-auto" onClick={handleOpenCreate}>
            <i className="bi bi-plus-circle me-1"></i> Create Your First Program
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {programs.map((p) => {
            const enrolled = p.enrolledCount || 0;
            const pct = Math.min(100, Math.round((enrolled / p.capacity) * 100));
            const canEdit = p.status === 'draft' || p.status === 'scheduled';
            const canDelete = p.status === 'draft' && enrolled === 0;

            return (
              <div key={p._id} className="col-12 col-md-6 col-xl-4">
                <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden position-relative">
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex gap-2 align-items-center">
                        {getStatusBadge(p.status)}
                        {getTypeBadge(p.type)}
                      </div>
                      <span className="badge bg-light text-secondary border text-capitalize">
                        {p.mode}
                      </span>
                    </div>

                    <h5 className="fw-bold text-dark mb-2">{p.title}</h5>
                    <p className="text-secondary small mb-3 text-truncate-2" style={{ maxHeight: '42px', overflow: 'hidden' }}>
                      {p.description}
                    </p>

                    <div className="small text-muted mb-3 d-flex flex-column gap-1">
                      <div>
                        <i className="bi bi-person-badge me-2 text-primary"></i>
                        <span>Trainer: <strong>{p.trainer || 'Internal'}</strong></span>
                      </div>
                      <div>
                        <i className="bi bi-calendar-event me-2 text-primary"></i>
                        <span>
                          {new Date(p.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} –{' '}
                          {new Date(p.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="mt-auto pt-3 border-top">
                      <div className="d-flex justify-content-between align-items-center small mb-1">
                        <span className="text-muted fw-semibold">Enrollment</span>
                        <span className="fw-bold text-dark">
                          {enrolled} / {p.capacity} Seats ({pct}%)
                        </span>
                      </div>
                      <div className="progress mb-3" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar ${pct >= 100 ? 'bg-danger' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex justify-content-between align-items-center gap-2">
                        <button
                          className="btn btn-outline-primary btn-sm rounded-3 flex-grow-1"
                          onClick={() => navigate(`/trainings/${p._id}`)}
                        >
                          <i className="bi bi-people me-1"></i> Roster & Details
                        </button>

                        {canEdit && (
                          <button
                            className="btn btn-outline-secondary btn-sm rounded-3"
                            title="Edit"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}

                        {canDelete && (
                          <button
                            className="btn btn-outline-danger btn-sm rounded-3"
                            title="Delete Draft"
                            onClick={() => handlePromptDelete(p._id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}

                        {p.status === 'draft' && (
                          <button
                            className="btn btn-info btn-sm rounded-3 text-white"
                            title="Schedule Program"
                            onClick={() => handleTransitionStatus(p._id, 'scheduled')}
                          >
                            <i className="bi bi-calendar-check"></i>
                          </button>
                        )}

                        {p.status === 'scheduled' && (
                          <button
                            className="btn btn-warning btn-sm rounded-3 text-dark"
                            title="Start Program"
                            onClick={() => handleTransitionStatus(p._id, 'ongoing')}
                          >
                            <i className="bi bi-play-fill"></i>
                          </button>
                        )}

                        {p.status === 'ongoing' && (
                          <button
                            className="btn btn-success btn-sm rounded-3"
                            title="Mark Completed"
                            onClick={() => handleTransitionStatus(p._id, 'completed')}
                          >
                            <i className="bi bi-check-lg"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <span className="small text-muted">
            Page {page} of {totalPages} ({total} programs)
          </span>
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-outline-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="btn btn-outline-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Program Modal */}
      <TrainingProgramModal
        show={programModalOpen}
        program={selectedProgram}
        onClose={() => setProgramModalOpen(false)}
        onSuccess={fetchPrograms}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteConfirmOpen}
        title="Delete Training Program"
        message="Are you sure you want to delete this draft training program? This action cannot be undone."
        confirmText="Delete Program"
        variant="danger"
        loading={deleteLoading}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
