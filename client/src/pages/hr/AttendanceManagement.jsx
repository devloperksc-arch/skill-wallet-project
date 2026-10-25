import React, { useState, useEffect, useCallback } from 'react';
import { getAllAttendance, getMonthlyAttendanceSummary } from '../../api/attendance.js';
import { departmentApi } from '../../api/departments.js';
import { employeeApi } from '../../api/employees.js';
import { http } from '../../api/http.js';
import AttendanceCorrectionModal from '../../components/attendance/AttendanceCorrectionModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AttendanceManagement() {
  const { showToast } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'monthly'

  // Daily logs filters & state
  const [dailyDate, setDailyDate] = useState(todayStr);
  const [dailyDept, setDailyDept] = useState('');
  const [dailyStatus, setDailyStatus] = useState('');
  const [dailyPage, setDailyPage] = useState(1);
  const [dailyData, setDailyData] = useState({ attendance: [], total: 0, totalPages: 1 });
  const [dailyLoading, setDailyLoading] = useState(false);

  // Monthly summary filters & state
  const [monthlyMonth, setMonthlyMonth] = useState(currentMonthKey);
  const [monthlyDept, setMonthlyDept] = useState('');
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Common metadata
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Correction modal state
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isNewMissing, setIsNewMissing] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Load departments and employee list on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [deptRes, empRes] = await Promise.all([
          departmentApi.list(),
          employeeApi.list({ limit: 200 }),
        ]);
        setDepartments(deptRes.data?.data?.departments || deptRes.data?.departments || []);
        setEmployees(empRes.data?.data?.employees || empRes.data?.employees || []);
      } catch (err) {
        console.error('Failed to load metadata', err);
      }
    };
    loadMetadata();
  }, []);

  // Fetch daily logs
  const fetchDailyLogs = useCallback(async () => {
    try {
      setDailyLoading(true);
      const params = {
        date: dailyDate || undefined,
        department: dailyDept || undefined,
        status: dailyStatus || undefined,
        page: dailyPage,
        limit: 20,
      };
      const res = await getAllAttendance(params);
      setDailyData(res);
    } catch (err) {
      console.error('Failed to load daily attendance', err);
    } finally {
      setDailyLoading(false);
    }
  }, [dailyDate, dailyDept, dailyStatus, dailyPage]);

  // Fetch monthly summary
  const fetchMonthlySummary = useCallback(async () => {
    try {
      setMonthlyLoading(true);
      const params = {
        month: monthlyMonth,
        department: monthlyDept || undefined,
      };
      const res = await getMonthlyAttendanceSummary(params);
      setMonthlyData(res.summary || []);
    } catch (err) {
      console.error('Failed to load monthly summary', err);
    } finally {
      setMonthlyLoading(false);
    }
  }, [monthlyMonth, monthlyDept]);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyLogs();
    } else {
      fetchMonthlySummary();
    }
  }, [activeTab, fetchDailyLogs, fetchMonthlySummary]);

  // Export CSV handler with Bearer token authentication
  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      const monthToExport = activeTab === 'monthly' ? monthlyMonth : dailyDate.slice(0, 7);
      const res = await http.get(`/attendance/export.csv?month=${encodeURIComponent(monthToExport)}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${monthToExport}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Attendance CSV exported successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export CSV', 'danger');
    } finally {
      setExportLoading(false);
    }
  };

  const handleOpenEdit = (record) => {
    setSelectedRecord(record);
    setIsNewMissing(false);
    setCorrectionModalOpen(true);
  };

  const handleOpenNewMissing = () => {
    setSelectedRecord(null);
    setIsNewMissing(true);
    setCorrectionModalOpen(true);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatHours = (mins) => {
    if (!mins && mins !== 0) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">Present</span>;
      case 'half-day':
        return <span className="badge bg-info-subtle text-info border border-info-subtle">Half Day</span>;
      case 'absent':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Absent</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary border">{status || '—'}</span>;
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Attendance Management</h2>
          <p className="text-secondary small mb-0">
            Monitor company-wide employee attendance logs, view monthly aggregations, and process manual corrections
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            className="btn btn-outline-success d-flex align-items-center gap-2"
            onClick={handleExportCsv}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              <i className="bi bi-file-earmark-spreadsheet"></i>
            )}
            <span>Export CSV</span>
          </button>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={handleOpenNewMissing}
          >
            <i className="bi bi-plus-circle"></i>
            <span>Log Missing Day</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 bg-white p-2 rounded-3 shadow-sm border">
        <li className="nav-item">
          <button
            className={`nav-link fw-semibold ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            <i className="bi bi-calendar3 me-2"></i> Daily Attendance Logs
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-semibold ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            <i className="bi bi-bar-chart-line me-2"></i> Monthly Summary Report
          </button>
        </li>
      </ul>

      {/* TAB 1: DAILY LOGS */}
      {activeTab === 'daily' && (
        <>
          {/* Filters Bar */}
          <div className="card shadow-sm border-0 mb-4 bg-white">
            <div className="card-body p-3">
              <div className="row g-3 align-items-center">
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="small text-muted fw-semibold mb-1 d-block">Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={dailyDate}
                    onChange={(e) => {
                      setDailyDate(e.target.value);
                      setDailyPage(1);
                    }}
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="small text-muted fw-semibold mb-1 d-block">Department</label>
                  <select
                    className="form-select form-select-sm"
                    value={dailyDept}
                    onChange={(e) => {
                      setDailyDept(e.target.value);
                      setDailyPage(1);
                    }}
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="small text-muted fw-semibold mb-1 d-block">Status</label>
                  <select
                    className="form-select form-select-sm"
                    value={dailyStatus}
                    onChange={(e) => {
                      setDailyStatus(e.target.value);
                      setDailyPage(1);
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="present">Present</option>
                    <option value="half-day">Half Day</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-3 d-flex align-items-end">
                  <button
                    className="btn btn-outline-secondary btn-sm w-100"
                    onClick={() => {
                      setDailyDate('');
                      setDailyDept('');
                      setDailyStatus('');
                      setDailyPage(1);
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">Records ({dailyData.total || 0})</h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchDailyLogs}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th className="ps-4">Date</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Duration</th>
                    <th>Remarks / Audit</th>
                    <th className="pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyLoading ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5 text-muted">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        Loading attendance logs...
                      </td>
                    </tr>
                  ) : !dailyData.attendance || dailyData.attendance.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5 text-muted">
                        No attendance records match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    dailyData.attendance.map((rec) => (
                      <tr key={rec._id}>
                        <td className="ps-4 fw-semibold text-dark">{rec.date}</td>
                        <td>
                          <div className="fw-semibold text-dark">{rec.user?.name || 'Unknown'}</div>
                          <div className="small text-muted">{rec.user?.employeeCode || rec.user?.email}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {rec.user?.department?.name || '—'}
                          </span>
                        </td>
                        <td>{getStatusBadge(rec.status)}</td>
                        <td>
                          {rec.checkIn ? (
                            <div className="d-flex align-items-center gap-1">
                              <span>{formatTime(rec.checkIn)}</span>
                              {rec.isLate && (
                                <span className="badge bg-warning-subtle text-warning border border-warning-subtle small px-1">
                                  Late
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {rec.checkOut ? (
                            formatTime(rec.checkOut)
                          ) : (
                            <span className="badge bg-secondary-subtle text-secondary small">
                              Missing Check-out
                            </span>
                          )}
                        </td>
                        <td>
                          {rec.workedMinutes ? (
                            <span className="fw-semibold">{formatHours(rec.workedMinutes)}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="small text-secondary">
                          {rec.note && <span className="d-block">{rec.note}</span>}
                          {rec.correctedBy && (
                            <span className="badge bg-info-subtle text-info border border-info-subtle small">
                              Corrected ({rec.history?.length || 1} edits)
                            </span>
                          )}
                        </td>
                        <td className="pe-4 text-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenEdit(rec)}
                          >
                            <i className="bi bi-pencil me-1"></i> Correct
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {dailyData.totalPages > 1 && (
              <div className="card-footer bg-white border-top py-3 d-flex justify-content-between align-items-center">
                <span className="small text-muted">
                  Page {dailyPage} of {dailyData.totalPages}
                </span>
                <div className="btn-group btn-group-sm">
                  <button
                    className="btn btn-outline-secondary"
                    disabled={dailyPage <= 1}
                    onClick={() => setDailyPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    disabled={dailyPage >= dailyData.totalPages}
                    onClick={() => setDailyPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: MONTHLY SUMMARY */}
      {activeTab === 'monthly' && (
        <>
          {/* Monthly Filters */}
          <div className="card shadow-sm border-0 mb-4 bg-white">
            <div className="card-body p-3">
              <div className="row g-3 align-items-center">
                <div className="col-12 col-sm-6 col-md-4">
                  <label className="small text-muted fw-semibold mb-1 d-block">Select Month</label>
                  <input
                    type="month"
                    className="form-control form-control-sm"
                    value={monthlyMonth}
                    onChange={(e) => setMonthlyMonth(e.target.value)}
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4">
                  <label className="small text-muted fw-semibold mb-1 d-block">Department</label>
                  <select
                    className="form-select form-select-sm"
                    value={monthlyDept}
                    onChange={(e) => setMonthlyDept(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Table */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">Monthly Aggregations ({monthlyMonth})</h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchMonthlySummary}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th className="ps-4">Employee</th>
                    <th>Department</th>
                    <th className="text-center text-success">Present</th>
                    <th className="text-center text-info">Half Days</th>
                    <th className="text-center text-warning">Late</th>
                    <th className="text-center text-danger">Absent</th>
                    <th className="text-center text-purple">Leaves</th>
                    <th className="pe-4 text-end">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyLoading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        Generating monthly summary...
                      </td>
                    </tr>
                  ) : monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        No employees found for this department.
                      </td>
                    </tr>
                  ) : (
                    monthlyData.map((row) => (
                      <tr key={row.user._id}>
                        <td className="ps-4">
                          <div className="fw-semibold text-dark">{row.user.name}</div>
                          <div className="small text-muted">{row.user.employeeCode || row.user.email}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {row.user.department?.name || '—'}
                          </span>
                        </td>
                        <td className="text-center fw-bold text-success">{row.present}</td>
                        <td className="text-center fw-bold text-info">{row.halfDay}</td>
                        <td className="text-center fw-bold text-warning">{row.late}</td>
                        <td className="text-center fw-bold text-danger">{row.absent}</td>
                        <td className="text-center fw-bold" style={{ color: '#7e22ce' }}>{row.onLeave}</td>
                        <td className="pe-4 text-end fw-bold text-primary">{row.totalHours}h</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Attendance Correction & Log Missing Modal */}
      <AttendanceCorrectionModal
        show={correctionModalOpen}
        attendance={selectedRecord}
        isNewMissing={isNewMissing}
        employees={employees}
        onClose={() => setCorrectionModalOpen(false)}
        onSuccess={() => {
          if (activeTab === 'daily') fetchDailyLogs();
          else fetchMonthlySummary();
        }}
      />
    </div>
  );
}
