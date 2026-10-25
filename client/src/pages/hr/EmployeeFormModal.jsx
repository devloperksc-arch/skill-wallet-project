import { useState, useEffect } from 'react';
import { employeeApi } from '../../api/employees.js';
import { departmentApi } from '../../api/departments.js';
import FormField from '../../components/FormField.jsx';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { ROLES } from '../../../../server/src/config/constants.js';

export default function EmployeeFormModal({
  show,
  onClose,
  employee = null,
  onSuccess,
}) {
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    department: '',
    designation: '',
    manager: '',
    dateOfJoining: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    // Fetch departments & managers for select dropdowns
    departmentApi.list().then((res) => setDepartments(res.data.data || []));
    employeeApi.list({ limit: 100 }).then((res) => {
      const eligible = (res.data.data || []).filter(
        (e) => e.role === 'manager' || e.role === 'hr'
      );
      setManagers(eligible);
    });
  }, []);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        role: employee.role || 'employee',
        department: employee.department?._id || employee.department || '',
        designation: employee.designation || '',
        manager: employee.manager?._id || employee.manager || '',
        dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.slice(0, 10) : '',
        phone: employee.phone || '',
        dob: employee.dob ? employee.dob.slice(0, 10) : '',
        gender: employee.gender || '',
        address: employee.address || '',
        emergencyContactName: employee.emergencyContact?.name || '',
        emergencyContactRelation: employee.emergencyContact?.relation || '',
        emergencyContactPhone: employee.emergencyContact?.phone || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'employee',
        department: '',
        designation: '',
        manager: '',
        dateOfJoining: new Date().toISOString().slice(0, 10),
        phone: '',
        dob: '',
        gender: '',
        address: '',
        emergencyContactName: '',
        emergencyContactRelation: '',
        emergencyContactPhone: '',
      });
    }
    setServerErrors({});
  }, [employee, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErrors({});
    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      department: formData.department || null,
      designation: formData.designation.trim(),
      manager: formData.manager || null,
      dateOfJoining: formData.dateOfJoining || undefined,
      phone: formData.phone.trim() || undefined,
      dob: formData.dob || undefined,
      gender: formData.gender || undefined,
      address: formData.address.trim() || undefined,
      emergencyContact: {
        name: formData.emergencyContactName.trim() || undefined,
        relation: formData.emergencyContactRelation.trim() || undefined,
        phone: formData.emergencyContactPhone.trim() || undefined,
      },
    };

    try {
      if (employee) {
        const res = await employeeApi.update(employee._id, payload);
        onSuccess(res.data.data, false);
      } else {
        const res = await employeeApi.create(payload);
        onSuccess(res.data.data.user, true, res.data.data.temporaryPassword);
      }
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors && Array.isArray(errors)) {
        const errMap = {};
        errors.forEach((e) => {
          errMap[e.field] = e.message;
        });
        setServerErrors(errMap);
      } else {
        setServerErrors({ general: err.response?.data?.message || 'Operation failed' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={() => !submitting && onClose()} size="lg" centered backdrop="static">
      <form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title className="h5 mb-0">
            <i className={`bi ${employee ? 'bi-pencil' : 'bi-person-plus'} me-2 text-primary`}></i>
            {employee ? `Edit Employee (${employee.employeeCode})` : 'Create New Employee'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {serverErrors.general && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
              <i className="bi bi-exclamation-circle me-1"></i> {serverErrors.general}
            </div>
          )}

          {/* Section 1: Account */}
          <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
            <i className="bi bi-person-badge me-2"></i> Account Details
          </h6>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <FormField label="Full Name" required id="emp-name" error={serverErrors.name}>
                <input
                  type="text"
                  className={`form-control ${serverErrors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={submitting}
                  required
                />
              </FormField>
            </div>

            <div className="col-12 col-md-6">
              <FormField label="Email Address" required id="emp-email" error={serverErrors.email}>
                <input
                  type="email"
                  className={`form-control ${serverErrors.email ? 'is-invalid' : ''}`}
                  placeholder="e.g. john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={submitting}
                  required
                />
              </FormField>
            </div>

            <div className="col-12 col-md-6">
              <FormField label="System Role" required id="emp-role" error={serverErrors.role}>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={submitting}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR Administrator</option>
                </select>
              </FormField>
            </div>
          </div>

          {/* Section 2: Workplace & Job */}
          <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
            <i className="bi bi-briefcase me-2"></i> Job Details
          </h6>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <FormField label="Designation / Job Title" required id="emp-desig" error={serverErrors.designation}>
                <input
                  type="text"
                  className={`form-control ${serverErrors.designation ? 'is-invalid' : ''}`}
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  disabled={submitting}
                  required
                />
              </FormField>
            </div>

            <div className="col-12 col-md-6">
              <FormField label="Department" id="emp-dept" error={serverErrors.department}>
                <select
                  className="form-select"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  disabled={submitting}
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="col-12 col-md-6">
              <FormField label="Reporting Manager" id="emp-mgr" error={serverErrors.manager} helperText="Leave empty to route approvals to HR pool">
                <select
                  className="form-select"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  disabled={submitting}
                >
                  <option value="">None (Routes directly to HR)</option>
                  {managers
                    .filter((m) => !employee || m._id !== employee._id)
                    .map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.designation || m.role}) — {m.email}
                      </option>
                    ))}
                </select>
              </FormField>
            </div>

            <div className="col-12 col-md-6">
              <FormField label="Date of Joining" id="emp-doj" error={serverErrors.dateOfJoining}>
                <input
                  type="date"
                  className="form-control"
                  value={formData.dateOfJoining}
                  onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                  disabled={submitting}
                />
              </FormField>
            </div>
          </div>

          {/* Section 3: Personal Information */}
          <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
            <i className="bi bi-person me-2"></i> Personal Information
          </h6>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <FormField label="Phone Number" id="emp-phone" error={serverErrors.phone}>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={submitting}
                />
              </FormField>
            </div>

            <div className="col-12 col-md-4">
              <FormField label="Date of Birth" id="emp-dob" error={serverErrors.dob}>
                <input
                  type="date"
                  className="form-control"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  disabled={submitting}
                />
              </FormField>
            </div>

            <div className="col-12 col-md-4">
              <FormField label="Gender" id="emp-gender" error={serverErrors.gender}>
                <select
                  className="form-select"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  disabled={submitting}
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FormField>
            </div>

            <div className="col-12">
              <FormField label="Residential Address" id="emp-addr" error={serverErrors.address}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Street address, City, State, Zip"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={submitting}
                />
              </FormField>
            </div>
          </div>

          {/* Section 4: Emergency Contact */}
          <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
            <i className="bi bi-telephone-plus me-2"></i> Emergency Contact
          </h6>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <FormField label="Contact Person" id="emp-ec-name">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Jane Doe"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  disabled={submitting}
                />
              </FormField>
            </div>

            <div className="col-12 col-md-4">
              <FormField label="Relationship" id="emp-ec-rel">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Spouse / Parent"
                  value={formData.emergencyContactRelation}
                  onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                  disabled={submitting}
                />
              </FormField>
            </div>

            <div className="col-12 col-md-4">
              <FormField label="Contact Phone" id="emp-ec-phone">
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+1 (555) 000-0000"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  disabled={submitting}
                />
              </FormField>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Saving...
              </>
            ) : (
              employee ? 'Update Employee' : 'Create & Generate Password'
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
