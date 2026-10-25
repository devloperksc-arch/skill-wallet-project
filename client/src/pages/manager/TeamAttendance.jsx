import React, { useState, useEffect, useCallback } from 'react';
import { getTeamAttendance } from '../../api/attendance.js';

export default function TeamAttendance() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'present', 'late', 'on-leave', 'not-checked-in'

  const fetchTeamAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTeamAttendance(selectedDate);
      setData(res);
    } catch (err) {
      console.error('Failed to load team attendance', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchTeamAttendance();
  }, [fetchTeamAttendance]);

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

  const getStatusBadge = (derivedStatus) => {
    switch (derivedStatus) {
      case 'present':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">Present</span>;
      case 'half-day':
        return <span className="badge bg-info-subtle text-info border border-info-subtle">Half Day</span>;
      case 'on-leave':
        return <span className="badge bg-purple-subtle text-purple border" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}>On Leave</span>;
      case 'holiday':
        return <span className="badge bg-warning-subtle text-warning border">Holiday</span>;
      case 'weekend':
        return <span className="badge bg-light text-secondary border">Weekend</span>;
      case 'absent':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Absent</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary border">Not Checked In</span>;
    }
  };

  const teamStatus = data?.teamStatus || [];
  const teamSummary = data?.teamSummary || {
    totalMembers: 0,
    presentCount: 0,
    lateCount: 0,
    onLeaveCount: 0,
    notCheckedInCount: 0,
  };

  // Filter team members based on selected chip
  const filteredList = teamStatus.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'present') return item.derivedStatus === 'present' || item.derivedStatus === 'half-day';
    if (filter === 'late') return !!item.record?.isLate;
    if (filter === 'on-leave') return item.hasApprovedLeave || item.derivedStatus === 'on-leave';
    if (filter === 'not-checked-in') return !item.record?.checkIn && !item.hasApprovedLeave;
    return true;
  });

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Team Attendance</h2>
          <p className="text-secondary small mb-0">
            Monitor real-time daily attendance, check-in timings, and leaves for your direct reports
          </p>
        </div>

        {/* Date Selector */}
        <div className="d-flex align-items-center gap-2">
          <input
            type="date"
            className="form-control form-control-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button
            className="btn btn-outline-primary btn-sm text-nowrap"
            onClick={() => setSelectedDate(todayStr)}
          >
            Today
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div
            className={`card shadow-sm border-0 cursor-pointer ${filter === 'all' ? 'border-primary border-2' : ''}`}
            onClick={() => setFilter('all')}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-body p-3 text-center">
              <span className="text-muted small fw-semibold text-uppercase">Total Team</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{teamSummary.totalMembers}</h3>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className={`card shadow-sm border-0 ${filter === 'present' ? 'border-success border-2' : ''}`}
            onClick={() => setFilter('present')}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-body p-3 text-center">
              <span className="text-muted small fw-semibold text-uppercase">Present Today</span>
              <h3 className="fw-bold text-success mb-0 mt-1">{teamSummary.presentCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className={`card shadow-sm border-0 ${filter === 'late' ? 'border-warning border-2' : ''}`}
            onClick={() => setFilter('late')}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-body p-3 text-center">
              <span className="text-muted small fw-semibold text-uppercase">Late Arrivals</span>
              <h3 className="fw-bold text-warning mb-0 mt-1">{teamSummary.lateCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className={`card shadow-sm border-0 ${filter === 'on-leave' ? 'border-purple border-2' : ''}`}
            onClick={() => setFilter('on-leave')}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-body p-3 text-center">
              <span className="text-muted small fw-semibold text-uppercase">On Leave</span>
              <h3 className="fw-bold text-purple mb-0 mt-1" style={{ color: '#7e22ce' }}>{teamSummary.onLeaveCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All Members ({teamSummary.totalMembers})
        </button>
        <button
          className={`btn btn-sm ${filter === 'present' ? 'btn-success' : 'btn-outline-success'}`}
          onClick={() => setFilter('present')}
        >
          Present ({teamSummary.presentCount})
        </button>
        <button
          className={`btn btn-sm ${filter === 'late' ? 'btn-warning' : 'btn-outline-warning'}`}
          onClick={() => setFilter('late')}
        >
          Late ({teamSummary.lateCount})
        </button>
        <button
          className={`btn btn-sm ${filter === 'on-leave' ? 'btn-purple' : 'btn-outline-secondary'}`}
          onClick={() => setFilter('on-leave')}
        >
          On Leave ({teamSummary.onLeaveCount})
        </button>
        <button
          className={`btn btn-sm ${filter === 'not-checked-in' ? 'btn-danger' : 'btn-outline-danger'}`}
          onClick={() => setFilter('not-checked-in')}
        >
          Not Checked In ({teamSummary.notCheckedInCount})
        </button>
      </div>

      {/* Team Attendance Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold text-dark mb-0">Team Status for {selectedDate}</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchTeamAttendance}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small text-uppercase">
              <tr>
                <th className="ps-4">Employee</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Worked Duration</th>
                <th className="pe-4">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading team attendance...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No team members match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const emp = item.user;
                  const rec = item.record;
                  return (
                    <tr key={emp._id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center"
                            style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}
                          >
                            {emp.name?.slice(0, 2).toUpperCase() || 'EM'}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{emp.name}</div>
                            <div className="small text-muted">
                              {emp.employeeCode || emp.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{getStatusBadge(item.derivedStatus)}</td>
                      <td>
                        {rec?.checkIn ? (
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
                        {rec?.checkOut ? (
                          formatTime(rec.checkOut)
                        ) : rec?.checkIn ? (
                          <span className="badge bg-secondary-subtle text-secondary small">
                            In Progress
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {rec?.workedMinutes ? (
                          <span className="fw-semibold text-dark">
                            {formatHours(rec.workedMinutes)}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="pe-4 small text-secondary">
                        {item.hasApprovedLeave && (
                          <span className="text-purple fw-semibold">
                            On Leave ({item.leaveType})
                          </span>
                        )}
                        {rec?.note && <span className="d-block text-muted">{rec.note}</span>}
                        {rec?.correctedBy && (
                          <span className="badge bg-info-subtle text-info small ms-1">
                            HR Corrected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
