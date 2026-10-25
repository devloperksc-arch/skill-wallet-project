import React, { useState, useEffect } from 'react';
import { createAnnouncement, updateAnnouncement } from '../../api/announcements.js';
import { useToast } from '../../context/ToastContext.jsx';
import AnnouncementCard from './AnnouncementCard.jsx';

export default function AnnouncementFormModal({ show, announcement, onClose, onSuccess }) {
  const { showToast } = useToast();
  const isEdit = !!announcement?._id;

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: 'general',
    priority: 'normal',
    audience: ['all'],
    isPinned: false,
    publishAt: '',
    expiresAt: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewTab, setPreviewTab] = useState(false);

  useEffect(() => {
    if (show) {
      setError('');
      setPreviewTab(false);
      if (announcement) {
        setFormData({
          title: announcement.title || '',
          body: announcement.body || '',
          category: announcement.category || 'general',
          priority: announcement.priority || 'normal',
          audience: announcement.audience?.length ? announcement.audience : ['all'],
          isPinned: !!announcement.isPinned,
          publishAt: announcement.publishAt ? new Date(announcement.publishAt).toISOString().slice(0, 16) : '',
          expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : '',
        });
      } else {
        const now = new Date();
        const nowLocalStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setFormData({
          title: '',
          body: '',
          category: 'general',
          priority: 'normal',
          audience: ['all'],
          isPinned: false,
          publishAt: nowLocalStr,
          expiresAt: '',
        });
      }
    }
  }, [show, announcement]);

  if (!show) return null;

  const handleAudienceChange = (role) => {
    let newAudience;
    if (role === 'all') {
      newAudience = ['all'];
    } else {
      const filtered = formData.audience.filter((a) => a !== 'all');
      if (filtered.includes(role)) {
        newAudience = filtered.filter((a) => a !== role);
        if (newAudience.length === 0) newAudience = ['all'];
      } else {
        newAudience = [...filtered, role];
      }
    }
    setFormData((prev) => ({ ...prev, audience: newAudience }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!formData.body.trim()) {
      setError('Announcement content/body is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        body: formData.body.trim(),
        category: formData.category,
        priority: formData.priority,
        audience: formData.audience,
        isPinned: formData.isPinned,
        publishAt: formData.publishAt ? new Date(formData.publishAt).toISOString() : new Date().toISOString(),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };

      if (isEdit) {
        await updateAnnouncement(announcement._id, payload);
        showToast('Announcement updated successfully', 'success');
      } else {
        await createAnnouncement(payload);
        showToast('Announcement created successfully', 'success');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Preview object for AnnouncementCard
  const previewAnnouncement = {
    title: formData.title || 'Untitled Announcement',
    body: formData.body || 'Your announcement body text will appear here...',
    category: formData.category,
    priority: formData.priority,
    isPinned: formData.isPinned,
    publishAt: formData.publishAt ? new Date(formData.publishAt) : new Date(),
    createdBy: { name: 'HR Preview' },
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-light border-bottom py-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary-subtle text-primary p-2">
                <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-megaphone'} fs-6`}></i>
              </span>
              <h5 className="modal-title fw-bold text-dark mb-0">
                {isEdit ? 'Edit Announcement' : 'Post New Announcement'}
              </h5>
            </div>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            )}

            {/* Toggle Editor vs Live Preview */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="small text-muted">Fill out the details below.</span>
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className={`btn ${!previewTab ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setPreviewTab(false)}
                >
                  <i className="bi bi-pencil me-1"></i> Edit
                </button>
                <button
                  type="button"
                  className={`btn ${previewTab ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setPreviewTab(true)}
                >
                  <i className="bi bi-eye me-1"></i> Live Preview
                </button>
              </div>
            </div>

            {previewTab ? (
              <div className="p-3 bg-light rounded-3 border">
                <h6 className="text-muted small fw-semibold text-uppercase mb-3">Audience Preview</h6>
                <AnnouncementCard announcement={previewAnnouncement} />
              </div>
            ) : (
              <form id="announcementForm" onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark">
                    Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Annual Company Offsite 2026 Announcement"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small text-dark">Category</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="general">General</option>
                      <option value="urgent">Urgent</option>
                      <option value="policy">Policy</option>
                      <option value="event">Event</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small text-dark">Priority</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark">
                    Announcement Body <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="Enter the full announcement text. Line breaks will be preserved."
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    required
                  ></textarea>
                  <div className="form-text small">Plain text formatting with preserved paragraphs. Safe from script injections.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-dark d-block">Target Audience</label>
                  <div className="d-flex flex-wrap gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="audAll"
                        checked={formData.audience.includes('all')}
                        onChange={() => handleAudienceChange('all')}
                      />
                      <label className="form-check-label small" htmlFor="audAll">
                        Entire Company (All Roles)
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="audEmp"
                        checked={formData.audience.includes('employee')}
                        disabled={formData.audience.includes('all')}
                        onChange={() => handleAudienceChange('employee')}
                      />
                      <label className="form-check-label small" htmlFor="audEmp">
                        Employees
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="audMgr"
                        checked={formData.audience.includes('manager')}
                        disabled={formData.audience.includes('all')}
                        onChange={() => handleAudienceChange('manager')}
                      />
                      <label className="form-check-label small" htmlFor="audMgr">
                        Managers
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="audHr"
                        checked={formData.audience.includes('hr')}
                        disabled={formData.audience.includes('all')}
                        onChange={() => handleAudienceChange('hr')}
                      />
                      <label className="form-check-label small" htmlFor="audHr">
                        HR Only
                      </label>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small text-dark">Publish Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={formData.publishAt}
                      onChange={(e) => setFormData({ ...formData, publishAt: e.target.value })}
                    />
                    <div className="form-text small">Set future date to schedule for later release.</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small text-dark">Expiry Date & Time (Optional)</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    />
                    <div className="form-text small">Announcement automatically hides after this time.</div>
                  </div>
                </div>

                <div className="form-check form-switch p-0 ps-5 mt-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="pinSwitch"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  />
                  <label className="form-check-label fw-semibold small" htmlFor="pinSwitch">
                    Pin this announcement to top of feed
                  </label>
                </div>
              </form>
            )}
          </div>

          <div className="modal-footer bg-light border-top py-2 px-4">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              form="announcementForm"
              className="btn btn-primary d-flex align-items-center gap-2"
              disabled={loading}
            >
              {loading && <span className="spinner-border spinner-border-sm"></span>}
              <span>{isEdit ? 'Save Changes' : 'Publish Announcement'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
