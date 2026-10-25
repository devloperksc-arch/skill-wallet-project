import { useState, useEffect, useCallback } from 'react';
import { departmentApi } from '../../api/departments.js';
import { employeeApi } from '../../api/employees.js';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import FormField from '../../components/FormField.jsx';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

export default function Departments() {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', head: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await departmentApi.list();
      setDepartments(res.data.data || []);
    } catch (err) {
      showToast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchPotentialHeads = useCallback(async () => {
    try {
      const res = await employeeApi.list({ limit: 100 });
      const eligible = (res.data.data || []).filter(
        (e) => e.role === 'manager' || e.role === 'hr'
      );
      setManagers(eligible);
    } catch (err) {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchPotentialHeads();
  }, [fetchDepartments, fetchPotentialHeads]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', description: '', head: '' });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      head: dept.head?._id || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        head: formData.head || null,
      };

      if (editingDept) {
        await departmentApi.update(editingDept._id, payload);
        showToast(`Department '${payload.name}' updated successfully`, 'success');
      } else {
        await departmentApi.create(payload);
        showToast(`Department '${payload.name}' created successfully`, 'success');
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save department';
      const errors = err.response?.data?.errors;
      if (errors && Array.isArray(errors)) {
        const fieldMap = {};
        errors.forEach((e) => {
          fieldMap[e.field] = e.message;
        });
        setFormErrors(fieldMap);
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await departmentApi.delete(deleteId);
      showToast('Department deleted successfully', 'success');
      setDeleteId(null);
      fetchDepartments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete department';
      showToast(msg, 'error');
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (row) => (
        <span className="badge bg-secondary-subtle text-secondary fw-bold px-2 py-1 rounded-2">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Department Name',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.name}</div>
          {row.description && <small className="text-muted text-truncate d-block" style={{ maxWidth: '300px' }}>{row.description}</small>}
        </div>
      ),
    },
    {
      key: 'head',
      label: 'Department Head',
      render: (row) =>
        row.head ? (
          <div>
            <div className="fw-medium small text-dark">{row.head.name}</div>
            <small className="text-muted">{row.head.email}</small>
          </div>
        ) : (
          <span className="text-muted small fst-italic">Unassigned</span>
        ),
    },
    {
      key: 'employeeCount',
      label: 'Employees',
      render: (row) => (
        <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1">
          {row.employeeCount} {row.employeeCount === 1 ? 'member' : 'members'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-end',
      tdClassName: 'text-end',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <button
            className="btn btn-outline-secondary btn-sm rounded-2 py-1 px-2"
            onClick={() => handleOpenEdit(row)}
            title="Edit department"
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button
            className="btn btn-outline-danger btn-sm rounded-2 py-1 px-2"
            onClick={() => setDeleteId(row._id)}
            title="Delete department"
          >
            <i className="bi bi-trash3"></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Organize company structure and departmental leadership"
        breadcrumb={[
          { label: 'Dashboard', path: '/hr' },
          { label: 'Departments', active: true },
        ]}
        actions={
          <button className="btn btn-primary d-flex align-items-center gap-2 rounded-3 shadow-sm" onClick={handleOpenCreate}>
            <i className="bi bi-plus-lg"></i>
            <span>Add Department</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={departments}
        loading={loading}
        emptyTitle="No departments found"
        emptyDescription="Create your first department to get started."
        emptyIcon="bi-building"
      />

      {/* Create / Edit Modal */}
      <Modal show={showModal} onHide={() => !submitting && setShowModal(false)} centered backdrop="static">
        <form onSubmit={handleSubmit} noValidate>
          <Modal.Header closeButton={!submitting}>
            <Modal.Title className="h5 mb-0">
              {editingDept ? 'Edit Department' : 'Create Department'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <FormField label="Department Name" required id="dept-name" error={formErrors.name}>
              <input
                type="text"
                className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                placeholder="e.g. Engineering"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={submitting}
                required
              />
            </FormField>

            <FormField label="Department Code" required id="dept-code" helperText="Short uppercase identifier (e.g. ENG, HR, FIN)" error={formErrors.code}>
              <input
                type="text"
                className={`form-control text-uppercase ${formErrors.code ? 'is-invalid' : ''}`}
                placeholder="e.g. ENG"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={submitting}
                required
              />
            </FormField>

            <FormField label="Description" id="dept-desc" error={formErrors.description}>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Brief department overview..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Department Head (Manager)" id="dept-head" error={formErrors.head}>
              <select
                className="form-select"
                value={formData.head}
                onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                disabled={submitting}
              >
                <option value="">No head assigned (Unassigned)</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role.toUpperCase()}) — {m.email}
                  </option>
                ))}
              </select>
            </FormField>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Saving...
                </>
              ) : (
                editingDept ? 'Save Changes' : 'Create Department'
              )}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={Boolean(deleteId)}
        title="Delete Department"
        message="Are you sure you want to delete this department? Departments with active employees cannot be deleted."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
