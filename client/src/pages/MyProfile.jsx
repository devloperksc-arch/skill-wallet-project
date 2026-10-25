import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { employeeApi } from '../api/employees.js';
import PageHeader from '../components/PageHeader.jsx';
import FormField from '../components/FormField.jsx';
import Spinner from 'react-bootstrap/Spinner';

export default function MyProfile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    phone: '',
    dob: '',
    gender: '',
    address: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        phone: user.phone || '',
        dob: user.dob ? user.dob.slice(0, 10) : '',
        gender: user.gender || '',
        address: user.address || '',
        emergencyContactName: user.emergencyContact?.name || '',
        emergencyContactRelation: user.emergencyContact?.relation || '',
        emergencyContactPhone: user.emergencyContact?.phone || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErrors({});
    setSubmitting(true);

    const payload = {
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
      const res = await employeeApi.updateMe(payload);
      updateUser(res.data.data);
      showToast('Profile information updated successfully!', 'success');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors && Array.isArray(errors)) {
        const errMap = {};
        errors.forEach((e) => {
          errMap[e.field] = e.message;
        });
        setServerErrors(errMap);
      } else {
        showToast(err.response?.data?.message || 'Failed to update profile', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information and contact preferences"
      />

      <div className="row g-4">
        {/* Left Column: Read-Only Workplace Summary Card */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center mb-4">
            <div
              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-2 mx-auto mb-3 shadow-sm"
              style={{ width: '80px', height: '80px' }}
            >
              {user?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'U'}
            </div>
            <h5 className="fw-bold mb-1">{user?.name}</h5>
            <p className="text-muted small mb-3">{user?.email}</p>

            <div className="d-flex justify-content-center gap-2 mb-3">
              <span className="badge bg-light text-dark border px-2 py-1 font-monospace">
                {user?.employeeCode}
              </span>
              <span className="badge bg-primary-subtle text-primary text-uppercase px-2 py-1">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
              <i className="bi bi-briefcase me-2 text-primary"></i> Employment Record
            </h6>
            <dl className="row mb-0 small">
              <dt className="col-5 text-muted fw-normal">Department</dt>
              <dd className="col-7 fw-semibold text-dark">{user?.department?.name || 'General'}</dd>

              <dt className="col-5 text-muted fw-normal">Designation</dt>
              <dd className="col-7 fw-semibold text-dark">{user?.designation || 'Staff'}</dd>

              <dt className="col-5 text-muted fw-normal">Manager</dt>
              <dd className="col-7 fw-semibold text-dark">{user?.manager?.name || 'HR Pool'}</dd>

              <dt className="col-5 text-muted fw-normal">Joined On</dt>
              <dd className="col-7 fw-semibold text-dark">
                {user?.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString() : '—'}
              </dd>
            </dl>
          </div>
        </div>

        {/* Right Column: Editable Personal Profile Form */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h6 className="fw-bold text-dark border-bottom pb-2 mb-4">
              <i className="bi bi-pencil-square me-2 text-primary"></i> Personal & Contact Information
            </h6>

            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <FormField label="Phone Number" id="my-phone" error={serverErrors.phone}>
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

                <div className="col-12 col-md-6">
                  <FormField label="Date of Birth" id="my-dob" error={serverErrors.dob}>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      disabled={submitting}
                    />
                  </FormField>
                </div>

                <div className="col-12 col-md-6">
                  <FormField label="Gender" id="my-gender" error={serverErrors.gender}>
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
                  <FormField label="Residential Address" id="my-address" error={serverErrors.address}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Street, City, State, Zip"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={submitting}
                    />
                  </FormField>
                </div>
              </div>

              {/* Emergency Contact */}
              <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                <i className="bi bi-telephone-plus me-2 text-primary"></i> Emergency Contact
              </h6>
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                  <FormField label="Contact Person" id="my-ec-name">
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
                  <FormField label="Relationship" id="my-ec-rel">
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
                  <FormField label="Contact Phone" id="my-ec-phone">
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

              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary px-4 py-2 rounded-3 shadow-sm" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Saving Changes...
                    </>
                  ) : (
                    'Save Profile Information'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
