import React, { useState, useEffect } from 'react';
import { createProgram, updateProgram } from '../../api/training.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function TrainingProgramModal({ show, program, onClose, onSuccess }) {
  const { showToast } = useToast();
  const isEdit = !!program?._id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'technical',
    mode: 'online',
    trainer: '',
    location: '',
    startDate: '',
    endDate: '',
    capacity: 20,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setError('');
      if (program) {
        setFormData({
          title: program.title || '',
          description: program.description || '',
          type: program.type || 'technical',
          mode: program.mode || 'online',
          trainer: program.trainer || '',
          location: program.location || '',
          startDate: program.startDate ? new Date(program.startDate).toISOString().slice(0, 16) : '',
          endDate: program.endDate ? new Date(program.endDate).toISOString().slice(0, 16) : '',
          capacity: program.capacity || 20,
        });
      } else {
        const now = new Date();
        const startLocal = new Date(now.getTime() + 86400000); // tomorrow
        const endLocal = new Date(now.getTime() + 3 * 86400000); // 3 days later
        setFormData({
          title: '',
          description: '',
          type: 'technical',
          mode: 'online',
          trainer: '',
          location: '',
          startDate: new Date(startLocal.getTime() - startLocal.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
          endDate: new Date(endLocal.getTime() - endLocal.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
          capacity: 20,
        });
      }
    }
  }, [show, program]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date must be greater than or equal to start date.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        mode: formData.mode,
        trainer: formData.trainer.trim() || undefined,
        location: formData.location.trim() || undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        capacity: Number(formData.capacity),
      };

      if (isEdit) {
        await updateProgram(program._id, payload);
        showToast('Training program updated successfully', 'success');
      } else {
        await createProgram(payload);
        showToast('Training program created in Draft status', 'success');
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

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-light border-bottom py-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary-subtle text-primary p-2">
                <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-mortarboard'} fs-6`}></i>
              </span>
              <h5 className="modal-title fw-bold text-dark mb-0">
                {isEdit ? 'Edit Training Program' : 'Create Training Program'}
              </h5>
            </div>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <form id="trainingProgramForm" onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{error}</span>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">
                  Program Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Full-Stack React & Node Performance Optimization"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold small text-dark">Category / Type</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="technical">Technical Skills</option>
                    <option value="soft_skills">Soft Skills & Communication</option>
                    <option value="compliance">Compliance & Security</option>
                    <option value="leadership">Leadership & Management</option>
                    <option value="onboarding">Team Onboarding</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold small text-dark">Delivery Mode</label>
                  <select
                    className="form-select"
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  >
                    <option value="online">Online / Virtual</option>
                    <option value="in_person">In-Person Classroom</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold small text-dark">Instructor / Trainer</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Senior Tech Lead"
                    value={formData.trainer}
                    onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold small text-dark">Location / Meeting URL</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Room 402 or Google Meet URL"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold small text-dark">
                    Start Date & Time <span className="text-danger">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold small text-dark">
                    End Date & Time <span className="text-danger">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold small text-dark">
                    Capacity (Seats) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    className="form-control"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark">
                  Course Description & Agenda <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Outline syllabus, prerequisites, and learning objectives..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                ></textarea>
              </div>
            </div>

            <div className="modal-footer bg-light border-top py-2 px-4">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm"></span>}
                <span>{isEdit ? 'Save Changes' : 'Create Program'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
