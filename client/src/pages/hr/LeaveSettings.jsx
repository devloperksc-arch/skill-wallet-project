import React, { useState, useEffect, useCallback } from 'react';
import {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from '../../api/leaveTypes.js';
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../../api/holidays.js';
import DataTable from '../../components/DataTable.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function LeaveSettings() {
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();

  const [activeTab, setActiveTab] = useState('types'); // 'types' | 'holidays'

  // Leave Types State
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({
    name: '',
    code: '',
    annualQuota: 0,
    isPaid: true,
    isUnlimited: false,
    isActive: true,
    description: '',
  });

  // Holidays State
  const [holidays, setHolidays] = useState([]);
  const [holidayYear, setHolidayYear] = useState(currentYear);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Load Leave Types
  const loadLeaveTypes = useCallback(async () => {
    setTypesLoading(true);
    try {
      const data = await getLeaveTypes();
      setLeaveTypes(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load leave types', 'danger');
    } finally {
      setTypesLoading(false);
    }
  }, [showToast]);

  // Load Holidays
  const loadHolidays = useCallback(async () => {
    setHolidaysLoading(true);
    try {
      const data = await getHolidays(holidayYear);
      setHolidays(data.holidays || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load holidays', 'danger');
    } finally {
      setHolidaysLoading(false);
    }
  }, [holidayYear, showToast]);

  useEffect(() => {
    loadLeaveTypes();
  }, [loadLeaveTypes]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  // Handle Leave Type Create/Edit
  const handleOpenTypeModal = (type = null) => {
    setFormError('');
    if (type) {
      setEditingType(type);
      setTypeForm({
        name: type.name,
        code: type.code,
        annualQuota: type.annualQuota,
        isPaid: type.isPaid,
        isUnlimited: type.isUnlimited,
        isActive: type.isActive,
        description: type.description || '',
      });
    } else {
      setEditingType(null);
      setTypeForm({
        name: '',
        code: '',
        annualQuota: 10,
        isPaid: true,
        isUnlimited: false,
        isActive: true,
        description: '',
      });
    }
    setShowTypeModal(true);
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editingType) {
        await updateLeaveType(editingType._id, typeForm);
        showToast('Leave type updated successfully', 'success');
      } else {
        await createLeaveType(typeForm);
        showToast('Leave type created successfully', 'success');
      }
      setShowTypeModal(false);
      loadLeaveTypes();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save leave type';
      setFormError(msg);
      showToast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteType = async (type) => {
    if (!window.confirm(`Are you sure you want to delete ${type.name}?`)) return;
    try {
      await deleteLeaveType(type._id);
      showToast('Leave type deleted successfully', 'success');
      loadLeaveTypes();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete leave type';
      showToast(msg, 'danger');
    }
  };

  // Handle Holiday Create/Edit
  const handleOpenHolidayModal = (hol = null) => {
    setFormError('');
    if (hol) {
      setEditingHoliday(hol);
      setHolidayForm({ name: hol.name, date: hol.date });
    } else {
      setEditingHoliday(null);
      setHolidayForm({ name: '', date: `${holidayYear}-01-01` });
    }
    setShowHolidayModal(true);
  };

  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editingHoliday) {
        await updateHoliday(editingHoliday._id, holidayForm);
        showToast('Holiday updated successfully', 'success');
      } else {
        await createHoliday(holidayForm);
        showToast('Holiday created successfully', 'success');
      }
      setShowHolidayModal(false);
      loadHolidays();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save holiday';
      setFormError(msg);
      showToast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (hol) => {
    if (!window.confirm(`Are you sure you want to delete ${hol.name}?`)) return;
    try {
      await deleteHoliday(hol._id);
      showToast('Holiday deleted successfully', 'success');
      loadHolidays();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete holiday';
      showToast(msg, 'danger');
    }
  };

  const typeColumns = [
    {
      header: 'Name',
      render: (row) => (
        <div>
          <span className="fw-semibold text-dark">{row.name}</span>
          <span className="badge bg-light text-muted ms-2">{row.code}</span>
        </div>
      ),
    },
    {
      header: 'Quota',
      render: (row) => (row.isUnlimited ? <span className="badge bg-info-subtle text-info">Unlimited</span> : `${row.annualQuota} days/year`),
    },
    {
      header: 'Paid Status',
      render: (row) => (
        <span className={`badge ${row.isPaid ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'}`}>
          {row.isPaid ? 'Paid' : 'Unpaid'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`badge ${row.isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'end',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => handleOpenTypeModal(row)}
            title="Edit"
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => handleDeleteType(row)}
            title="Delete"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      ),
    },
  ];

  const holidayColumns = [
    {
      header: 'Holiday Name',
      render: (row) => <span className="fw-semibold text-dark">{row.name}</span>,
    },
    {
      header: 'Date',
      render: (row) => (
        <div>
          <span className="badge bg-light text-dark me-2">{row.date}</span>
          <span className="text-muted small">
            {new Date(row.date + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      align: 'end',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => handleOpenHolidayModal(row)}
            title="Edit"
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => handleDeleteHoliday(row)}
            title="Delete"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="container-fluid py-2">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">Leave Settings & Holidays</h2>
          <p className="text-muted mb-0">
            Configure company leave types, annual quotas, and official holiday schedules.
          </p>
        </div>
        <div>
          {activeTab === 'types' ? (
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => handleOpenTypeModal()}>
              <i className="bi bi-plus-lg"></i>
              Add Leave Type
            </button>
          ) : (
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => handleOpenHolidayModal()}>
              <i className="bi bi-calendar-plus"></i>
              Add Holiday
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'types' ? 'active' : ''}`}
            onClick={() => setActiveTab('types')}
          >
            <i className="bi bi-card-checklist me-1"></i>
            Leave Types ({leaveTypes.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'holidays' ? 'active' : ''}`}
            onClick={() => setActiveTab('holidays')}
          >
            <i className="bi bi-calendar-event me-1"></i>
            Holidays ({holidays.length})
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="card shadow-sm border-0">
        {activeTab === 'holidays' && (
          <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <span className="fw-semibold text-muted">Select Year</span>
            <select
              className="form-select form-select-sm w-auto"
              value={holidayYear}
              onChange={(e) => setHolidayYear(Number(e.target.value))}
            >
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear + 1}>{currentYear + 1}</option>
            </select>
          </div>
        )}

        <div className="card-body p-0">
          {activeTab === 'types' ? (
            <DataTable
              columns={typeColumns}
              data={leaveTypes}
              loading={typesLoading}
              emptyMessage="No leave types configured."
            />
          ) : (
            <DataTable
              columns={holidayColumns}
              data={holidays}
              loading={holidaysLoading}
              emptyMessage={`No holidays configured for year ${holidayYear}.`}
            />
          )}
        </div>
      </div>

      {/* Leave Type Modal */}
      {showTypeModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  {editingType ? 'Edit Leave Type' : 'Add Leave Type'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTypeModal(false)}></button>
              </div>
              <form onSubmit={handleSaveType}>
                <div className="modal-body p-4">
                  {formError && (
                    <div className="alert alert-danger py-2 small mb-3">
                      {formError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Casual Leave"
                      value={typeForm.name}
                      onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Code</label>
                    <input
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="e.g. CASUAL"
                      value={typeForm.code}
                      onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Annual Quota (days)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={typeForm.annualQuota}
                      onChange={(e) => setTypeForm({ ...typeForm, annualQuota: Number(e.target.value) })}
                      disabled={typeForm.isUnlimited}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-4">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="isPaidCheck"
                          className="form-check-input"
                          checked={typeForm.isPaid}
                          onChange={(e) => setTypeForm({ ...typeForm, isPaid: e.target.checked })}
                        />
                        <label htmlFor="isPaidCheck" className="form-check-label small fw-semibold">
                          Paid Leave
                        </label>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="isUnlimitedCheck"
                          className="form-check-input"
                          checked={typeForm.isUnlimited}
                          onChange={(e) => setTypeForm({ ...typeForm, isUnlimited: e.target.checked })}
                        />
                        <label htmlFor="isUnlimitedCheck" className="form-check-label small fw-semibold">
                          Unlimited
                        </label>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="isActiveCheck"
                          className="form-check-input"
                          checked={typeForm.isActive}
                          onChange={(e) => setTypeForm({ ...typeForm, isActive: e.target.checked })}
                        />
                        <label htmlFor="isActiveCheck" className="form-check-label small fw-semibold">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Optional details or policies..."
                      value={typeForm.description}
                      onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowTypeModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowHolidayModal(false)}></button>
              </div>
              <form onSubmit={handleSaveHoliday}>
                <div className="modal-body p-4">
                  {formError && (
                    <div className="alert alert-danger py-2 small mb-3">
                      {formError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Holiday Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Independence Day"
                      value={holidayForm.name}
                      onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={holidayForm.date}
                      onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-top bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowHolidayModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
