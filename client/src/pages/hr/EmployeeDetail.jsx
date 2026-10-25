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
import { getUserBalances } from '../../api/leaves.js';
import { getAllAttendance } from '../../api/attendance.js';
import { getUserEnrollments } from '../../api/training.js';
import AdjustBalanceModal from '../../components/leaves/AdjustBalanceModal.jsx';

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

  const [leaveBalances, setLeaveBalances] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [balanceToAdjust, setBalanceToAdjust] = useState(null);

  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [trainings, setTrainings] = useState([]);
  const [trainingsLoading, setTrainingsLoading] = useState(false);

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

  const fetchLeaveBalances = useCallback(async () => {
    try {
      setLeavesLoading(true);
      const res = await getUserBalances(id, new Date().getFullYear());
      setLeaveBalances(res.balances || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLeavesLoading(false);
    }
  }, [id]);

  const fetchAttendanceLogs = useCallback(async () => {
    try {
      setAttendanceLoading(true);
      const res = await getAllAttendance({ userId: id, limit: 31 });
      setAttendanceLogs(res.attendance || []);
    } catch (err) {
      console.error('Failed to load attendance logs for employee', err);
    } finally {
      setAttendanceLoading(false);
    }
  }, [id]);

  const fetchTrainings = useCallback(async () => {
    try {
      setTrainingsLoading(true);
      const data = await getUserEnrollments(id);
      setTrainings(data || []);
    } catch (err) {
      console.error('Failed to load employee training enrollments', err);
    } finally {
      setTrainingsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  useEffect(() => {
    if (activeTab === 'leaves') {
      fetchLeaveBalances();
    } else if (activeTab === 'attendance') {
      fetchAttendanceLogs();
    } else if (activeTab === 'training') {
      fetchTrainings();
    }
  }, [activeTab, fetchLeaveBalances, fetchAttendanceLogs, fetchTrainings]);

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

          <Tab eventKey="leaves" title="Leave Balances">
            <div className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-calendar-check me-2 text-primary"></i>
                  Annual Leave Quotas & Balances ({new Date().getFullYear()})
                </h6>
              </div>

              {leavesLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <span className="ms-2 small text-muted">Loading balances…</span>
                </div>
              ) : leaveBalances.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  No leave balance records found for this employee.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th>Leave Type</th>
                        <th>Allocated Quota</th>
                        <th>Used</th>
                        <th>Pending</th>
                        <th>Available</th>
                        {isHr && <th className="text-end">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {leaveBalances.map((b) => {
                        const lt = b.leaveType || {};
                        const avail = lt.isUnlimited
                          ? 'Unlimited'
                          : Math.max(0, b.allocated - b.used - b.pending);

                        return (
                          <tr key={b._id}>
                            <td>
                              <span className="fw-semibold text-dark">{lt.name}</span>
                              <span className="badge bg-light text-muted ms-2">{lt.code}</span>
                            </td>
                            <td>{lt.isUnlimited ? '∞' : `${b.allocated} days`}</td>
                            <td><span className="badge bg-info-subtle text-info">{b.used} days</span></td>
                            <td><span className="badge bg-warning-subtle text-warning">{b.pending} days</span></td>
                            <td>
                              <span className="fw-bold text-success">
                                {avail} {lt.isUnlimited ? '' : 'days'}
                              </span>
                            </td>
                            {isHr && (
                              <td className="text-end">
                                {!lt.isUnlimited && (
                                  <button
                                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                    onClick={() => setBalanceToAdjust(b)}
                                  >
                                    <i className="bi bi-sliders"></i>
                                    Adjust Quota
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Tab>

          <Tab eventKey="attendance" title="Attendance">
            <div className="pt-2">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0">Recent Attendance Logs</h6>
                <button className="btn btn-outline-secondary btn-sm" onClick={fetchAttendanceLogs}>
                  <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                </button>
              </div>

              {attendanceLoading ? (
                <div className="text-center py-5 text-muted">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <span className="ms-2">Loading attendance records...</span>
                </div>
              ) : attendanceLogs.length === 0 ? (
                <div className="text-center py-5 text-muted border rounded-3 bg-light-subtle">
                  <i className="bi bi-clock-history fs-2 mb-2 d-block opacity-50"></i>
                  No attendance records recorded for this employee yet.
                </div>
              ) : (
                <div className="table-responsive border rounded-3">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-uppercase">
                      <tr>
                        <th className="ps-3">Date</th>
                        <th>Status</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Worked Time</th>
                        <th className="pe-3">Audit / Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceLogs.map((log) => (
                        <tr key={log._id}>
                          <td className="ps-3 fw-semibold text-dark">{log.date}</td>
                          <td>
                            <span
                              className={`badge ${
                                log.status === 'present'
                                  ? 'bg-success-subtle text-success border border-success-subtle'
                                  : log.status === 'half-day'
                                  ? 'bg-info-subtle text-info border border-info-subtle'
                                  : 'bg-danger-subtle text-danger border border-danger-subtle'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td>
                            {log.checkIn ? (
                              <div className="d-flex align-items-center gap-1">
                                <span>{new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {log.isLate && (
                                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle small px-1">
                                    Late
                                  </span>
                                )}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {log.checkOut
                              ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : <span className="badge bg-secondary-subtle text-secondary small">Missing Check-out</span>}
                          </td>
                          <td>
                            {log.workedMinutes != null
                              ? `${Math.floor(log.workedMinutes / 60)}h ${log.workedMinutes % 60}m`
                              : '—'}
                          </td>
                          <td className="pe-3 small text-secondary">
                            {log.note && <span>{log.note}</span>}
                            {log.correctedBy && (
                              <span className="badge bg-info-subtle text-info small ms-1">
                                HR Corrected
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Tab>

          <Tab eventKey="training" title="Training & Skills">
            <div className="pt-2">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0">Enrolled Training Programs</h6>
                <button className="btn btn-outline-secondary btn-sm" onClick={fetchTrainings}>
                  <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                </button>
              </div>

              {trainingsLoading ? (
                <div className="text-center py-5 text-muted">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <span className="ms-2">Loading training records...</span>
                </div>
              ) : trainings.length === 0 ? (
                <div className="text-center py-5 text-muted border rounded-3 bg-light-subtle">
                  <i className="bi bi-mortarboard fs-2 mb-2 d-block opacity-50"></i>
                  This employee is not currently enrolled in any training programs.
                </div>
              ) : (
                <div className="table-responsive border rounded-3">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-uppercase">
                      <tr>
                        <th className="ps-3">Program Title</th>
                        <th>Type / Mode</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Score</th>
                        <th className="pe-3">Feedback / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainings.map((t) => (
                        <tr key={t._id}>
                          <td className="ps-3">
                            <div className="fw-semibold text-dark">{t.program?.title || 'Program'}</div>
                            <div className="small text-muted">
                              Trainer: {t.program?.trainer || 'Internal'}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border text-capitalize me-1">
                              {t.program?.type?.replace('_', ' ') || 'Technical'}
                            </span>
                            <span className="badge bg-light text-secondary border text-capitalize">
                              {t.program?.mode || 'online'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                t.status === 'completed'
                                  ? 'bg-success-subtle text-success border border-success-subtle'
                                  : t.status === 'in_progress'
                                  ? 'bg-warning-subtle text-warning border border-warning-subtle'
                                  : 'bg-info-subtle text-info border border-info-subtle'
                              }`}
                            >
                              {t.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ minWidth: '110px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                <div
                                  className={`progress-bar ${t.progress === 100 ? 'bg-success' : 'bg-primary'}`}
                                  style={{ width: `${t.progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="small fw-semibold">{t.progress || 0}%</span>
                            </div>
                          </td>
                          <td>
                            {t.score != null ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold">
                                {t.score} / 100
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="pe-3 small text-secondary">
                            {t.feedback && <div className="text-truncate" style={{ maxWidth: '180px' }}>Feedback: {t.feedback}</div>}
                            {t.managerNote && <div className="text-truncate text-muted" style={{ maxWidth: '180px' }}>Note: {t.managerNote}</div>}
                            {!t.feedback && !t.managerNote && <span className="text-muted">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

      {/* Adjust Leave Balance Modal */}
      <AdjustBalanceModal
        show={!!balanceToAdjust}
        balance={balanceToAdjust}
        onClose={() => setBalanceToAdjust(null)}
        onSuccess={() => {
          setBalanceToAdjust(null);
          fetchLeaveBalances();
        }}
      />
    </div>
  );
}
