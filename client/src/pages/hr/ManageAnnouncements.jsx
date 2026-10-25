import React, { useState, useEffect, useCallback } from 'react';
import {
  getManageAnnouncements,
  deleteAnnouncement,
  togglePin,
} from '../../api/announcements.js';
import AnnouncementFormModal from '../../components/announcements/AnnouncementFormModal.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function ManageAnnouncements() {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(''); // '' (all) | 'live' | 'scheduled' | 'expired'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter || undefined,
        page,
        limit: 15,
      };
      const res = await getManageAnnouncements(params);
      setAnnouncements(res.announcements || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load manage announcements', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenCreate = () => {
    setSelectedAnnouncement(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedAnnouncement(item);
    setFormModalOpen(true);
  };

  const handleTogglePin = async (id) => {
    try {
      await togglePin(id);
      showToast('Announcement pin status updated', 'success');
      fetchAnnouncements();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle pin', 'danger');
    }
  };

  const handlePromptDelete = (id) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await deleteAnnouncement(deletingId);
      showToast('Announcement deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      fetchAnnouncements();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete announcement', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStateBadge = (state) => {
    switch (state) {
      case 'live':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">Live</span>;
      case 'scheduled':
        return <span className="badge bg-info-subtle text-info border border-info-subtle">Scheduled</span>;
      case 'expired':
        return <span className="badge bg-secondary-subtle text-secondary border">Expired</span>;
      default:
        return <span className="badge bg-light text-dark border">{state}</span>;
    }
  };

  const getPriorityBadge = (pri) => {
    switch (pri) {
      case 'urgent':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Urgent</span>;
      case 'high':
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle">High</span>;
      default:
        return <span className="badge bg-light text-secondary border">Normal</span>;
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Manage Announcements</h2>
          <p className="text-secondary small mb-0">
            Publish company-wide announcements, schedule future updates, and manage target audience
          </p>
        </div>

        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenCreate}>
          <i className="bi bi-megaphone-fill"></i>
          <span>New Announcement</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => {
            setStatusFilter('');
            setPage(1);
          }}
        >
          All Announcements
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'live' ? 'btn-success' : 'btn-outline-success'}`}
          onClick={() => {
            setStatusFilter('live');
            setPage(1);
          }}
        >
          Live
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'scheduled' ? 'btn-info' : 'btn-outline-info'}`}
          onClick={() => {
            setStatusFilter('scheduled');
            setPage(1);
          }}
        >
          Scheduled
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'expired' ? 'btn-secondary' : 'btn-outline-secondary'}`}
          onClick={() => {
            setStatusFilter('expired');
            setPage(1);
          }}
        >
          Expired
        </button>
      </div>

      {/* Announcements Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold text-dark mb-0">Announcements List ({total})</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchAnnouncements}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small text-uppercase">
              <tr>
                <th className="ps-4">Pin</th>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Audience</th>
                <th>State</th>
                <th>Publish Date</th>
                <th>Expiry Date</th>
                <th className="pe-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading announcements...
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    No announcements found.
                  </td>
                </tr>
              ) : (
                announcements.map((item) => (
                  <tr key={item._id}>
                    <td className="ps-4">
                      <button
                        type="button"
                        className={`btn btn-sm p-0 border-0 ${
                          item.isPinned ? 'text-primary' : 'text-muted'
                        }`}
                        title={item.isPinned ? 'Unpin announcement' : 'Pin to top'}
                        onClick={() => handleTogglePin(item._id)}
                      >
                        <i
                          className={`bi ${
                            item.isPinned ? 'bi-pin-angle-fill fs-5' : 'bi-pin-angle fs-5'
                          }`}
                        ></i>
                      </button>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{item.title}</div>
                      <div className="small text-muted text-truncate" style={{ maxWidth: '280px' }}>
                        {item.body}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border text-uppercase">
                        {item.category}
                      </span>
                    </td>
                    <td>{getPriorityBadge(item.priority)}</td>
                    <td>
                      {item.audience?.includes('all') ? (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                          All
                        </span>
                      ) : (
                        item.audience?.map((role) => (
                          <span
                            key={role}
                            className="badge bg-light text-dark border text-capitalize me-1"
                          >
                            {role}
                          </span>
                        ))
                      )}
                    </td>
                    <td>{getStateBadge(item.state)}</td>
                    <td className="small text-secondary">
                      {new Date(item.publishAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="small text-secondary">
                      {item.expiresAt
                        ? new Date(item.expiresAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Never'}
                    </td>
                    <td className="pe-4 text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-secondary"
                          title="Edit"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          title="Delete"
                          onClick={() => handlePromptDelete(item._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex justify-content-between align-items-center">
            <span className="small text-muted">
              Page {page} of {totalPages}
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
      </div>

      {/* Create / Edit Modal */}
      <AnnouncementFormModal
        show={formModalOpen}
        announcement={selectedAnnouncement}
        onClose={() => setFormModalOpen(false)}
        onSuccess={fetchAnnouncements}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteConfirmOpen}
        title="Delete Announcement"
        message="Are you sure you want to permanently delete this announcement? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
