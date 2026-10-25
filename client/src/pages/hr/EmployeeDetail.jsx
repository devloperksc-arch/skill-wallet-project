import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { employeeApi } from '../../api/employees.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmployeeFormModal from './EmployeeFormModal.jsx';
import ResetPasswordModal from '../../components/ResetPasswordModal.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import Spinner from 'react-bootstrap/Spinner';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const isHr = currentUser?.role === 'hr';

  const fetchEmployee = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employeeApi.get(id);
      setEmployee(res.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load employee details', 'error');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleToggleStatus = async () => {
    if (!employee) return;
    const nextStatus = employee.status === 'active' ? 'inactive' : 'active';
    try {
      setStatusLoading(true);
      await employeeApi.updateStatus(employee._id, nextStatus);
      showToast(`Employee marked as ${nextStatus}`, 'success');
      setShowStatusConfirm(false);
      fetchEmployee();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const res = await employeeApi.resetPassword(employee._id);
      setTempPassword(res.data.data.temporaryPassword);
      setShowResetModal(true);
      showToast('Temporary password generated', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="text-muted small mt-2">Loading profile details...</div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div>
      <PageHeader
        title={employee.name}
        subtitle={`${employee.designation || 'Staff'} • ${employee.department?.name || 'General'}`}
        breadcrumb={[
          { label: 'Employees', path: '/employees' },
          { label: employee.employeeCode, active: true },
        ]}
        actions={
          isHr && (
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary btn-sm rounded-3 px-3"
                onClick={handleResetPassword}
              >
                <i className="bi bi-key me-1"></i> Reset Password
              </button>
              <button
                className={`btn btn-outline-${employee.status === 'active' ? 'danger' : 'success'} btn-sm rounded-3 px-3`}
                onClick={() => setShowStatusConfirm(true)}
              >
                <i className={`bi bi-${employee.status === 'active' ? 'slash-circle' : 'check-circle'} me-1`}></i>
                {employee.status === 'active' ? 'Deactivate' : 'Reactivate'}
              </button>
              <button
                className="btn btn-primary btn-sm rounded-3 px-3 shadow-sm"
                onClick={() => setShowEditModal(true)}
              >
                <i className="bi bi-pencil me-1"></i> Edit Profile
              </button>
            </div>
          )
        }
      />

      {/* Profile Header Banner */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4 shadow-sm"
              style={{ width: '64px', height: '64px', minWidth: '64px' }}
            >
              {employee.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h4 className="fw-bold mb-0 text-dark">{employee.name}</h4>
                <StatusBadge status={employee.status} />
              </div>
              <div className="text-muted small">
                <span className="badge bg-light text-dark border me-2">{employee.employeeCode}</span>
                <span className="text-uppercase fw-semibold me-2">{employee.role}</span>
                &bull; <span className="ms-2">{employee.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm rounded-4 p-4">
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
          <Tab eventKey="overview" title="Profile Overview">
            <div className="row g-4">
              {/* Workplace Details */}
              <div className="col-12 col-md-6">
                <div className="border rounded-4 p-4 h-100 bg-light-subtle">
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                    <i className="bi bi-building me-2 text-primary"></i> Workplace Information
                  </h6>
                  <dl className="row mb-0 small">
                    <dt className="col-5 text-muted fw-normal">Department</dt>
                    <dd className="col-7 fw-semibold text-dark">{employee.department?.name || 'None'}</dd>

                    <dt className="col-5 text-muted fw-normal">Designation</dt>
                    <dd className="col-7 fw-semibold text-dark">{employee.designation || '—'}</dd>

                    <dt className="col-5 text-muted fw-normal">Reporting Manager</dt>
                    <dd className="col-7 fw-semibold text-dark">
                      {employee.manager ? (
                        <span>
                          {employee.manager.name} ({employee.manager.employeeCode})
                        </span>
                      ) : (
                        <span className="text-muted fst-italic">HR Department Pool</span>
                      )}
                    </dd>

                    <dt className="col-5 text-muted fw-normal">Date of Joining</dt>
                    <dd className="col-7 fw-semibold text-dark">
                      {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '—'}
                    </dd>

                    <dt className="col-5 text-muted fw-normal">System Role</dt>
                    <dd className="col-7 fw-semibold text-uppercase text-dark">{employee.role}</dd>
                  </dl>
                </div>
              </div>

              {/* Personal Details */}
              <div className="col-12 col-md-6">
                <div className="border rounded-4 p-4 h-100 bg-light-subtle">
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                    <i className="bi bi-person me-2 text-primary"></i> Personal Details
                  </h6>
                  <dl className="row mb-0 small">
                    <dt className="col-5 text-muted fw-normal">Email Address</dt>
                    <dd className="col-7 fw-semibold text-dark">{employee.email}</dd>

                    <dt className="col-5 text-muted fw-normal">Phone</dt>
                    <dd className="col-7 fw-semibold text-dark">{employee.phone || '—'}</dd>

                    <dt className="col-5 text-muted fw-normal">Date of Birth</dt>
                    <dd className="col-7 fw-semibold text-dark">
                      {employee.dob ? new Date(employee.dob).toLocaleDateString() : '—'}
                    </dd>

                    <dt className="col-5 text-muted fw-normal">Gender</dt>
                    <dd className="col-7 fw-semibold text-capitalize text-dark">{employee.gender || '—'}</dd>

                    <dt className="col-5 text-muted fw-normal">Address</dt>
                    <dd className="col-7 fw-semibold text-dark">{employee.address || '—'}</dd>
                  </dl>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="col-12">
                <div className="border rounded-4 p-4 bg-light-subtle">
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                    <i className="bi bi-telephone-plus me-2 text-primary"></i> Emergency Contact
                  </h6>
                  <dl className="row mb-0 small">
                    <dt className="col-sm-3 text-muted fw-normal">Contact Person</dt>
                    <dd className="col-sm-9 fw-semibold text-dark">{employee.emergencyContact?.name || '—'}</dd>

                    <dt className="col-sm-3 text-muted fw-normal">Relationship</dt>
                    <dd className="col-sm-9 fw-semibold text-dark">{employee.emergencyContact?.relation || '—'}</dd>

                    <dt className="col-sm-3 text-muted fw-normal">Contact Phone</dt>
                    <dd className="col-sm-9 fw-semibold text-dark">{employee.emergencyContact?.phone || '—'}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Tab>

          <Tab eventKey="leaves" title="Leaves (Ch. 3)">
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar2-range fs-1 mb-2 d-block opacity-50"></i>
              <h6 className="fw-bold">Leave Lifecycle Module</h6>
              <p className="small mb-0">Leave balances, application history, and approval tracking will unlock in Chapter 3.</p>
            </div>
          </Tab>

          <Tab eventKey="attendance" title="Attendance (Ch. 4)">
            <div className="text-center py-5 text-muted">
              <i className="bi bi-clock-history fs-1 mb-2 d-block opacity-50"></i>
              <h6 className="fw-bold">Attendance Records</h6>
              <p className="small mb-0">Daily check-in and check-out tracking will unlock in Chapter 4.</p>
            </div>
          </Tab>

          <Tab eventKey="training" title="Training (Ch. 5)">
            <div className="text-center py-5 text-muted">
              <i className="bi bi-mortarboard fs-1 mb-2 d-block opacity-50"></i>
              <h6 className="fw-bold">Training & Development</h6>
              <p className="small mb-0">Skill development programs and enrollments will unlock in Chapter 5.</p>
            </div>
          </Tab>
        </Tabs>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EmployeeFormModal
          show={showEditModal}
          employee={employee}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            setEmployee(updated);
            showToast('Employee details updated successfully', 'success');
          }}
        />
      )}

      {/* Reset Password Modal */}
      <ResetPasswordModal
        show={showResetModal}
        employeeName={employee.name}
        temporaryPassword={tempPassword}
        onClose={() => setShowResetModal(false)}
      />

      {/* Deactivate/Reactivate Confirm Modal */}
      <ConfirmModal
        show={showStatusConfirm}
        title={`${employee.status === 'active' ? 'Deactivate' : 'Reactivate'} Employee`}
        message={`Are you sure you want to mark ${employee.name} as ${employee.status === 'active' ? 'inactive' : 'active'}? ${
          employee.status === 'active'
            ? 'Deactivating will terminate all their active sessions and prevent further logins.'
            : 'Reactivating will allow this employee to sign in again.'
        }`}
        confirmText={employee.status === 'active' ? 'Deactivate Employee' : 'Reactivate Employee'}
        variant={employee.status === 'active' ? 'danger' : 'success'}
        loading={statusLoading}
        onConfirm={handleToggleStatus}
        onCancel={() => setShowStatusConfirm(false)}
      />
    </div>
  );
}
