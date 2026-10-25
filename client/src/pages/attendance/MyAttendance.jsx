import React, { useState, useEffect, useCallback } from 'react';
import AttendanceWidget from '../../components/attendance/AttendanceWidget.jsx';
import { getMyMonthlyAttendance } from '../../api/attendance.js';

export default function MyAttendance() {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyMonthlyAttendance(selectedMonth);
      setData(res);
    } catch (err) {
      console.error('Failed to load monthly attendance', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
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

  const getStatusBadge = (derivedStatus, record) => {
    switch (derivedStatus) {
      case 'present':
        return (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
            <i className="bi bi-check-circle me-1"></i> Present
          </span>
        );
      case 'half-day':
        return (
          <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
            <i className="bi bi-pie-chart me-1"></i> Half Day
          </span>
        );
      case 'absent':
        return (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
            <i className="bi bi-x-circle me-1"></i> Absent
          </span>
        );
      case 'on-leave':
        return (
          <span className="badge bg-purple-subtle text-purple border border-purple-subtle px-2 py-1" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
            <i className="bi bi-calendar-event me-1"></i> On Leave
          </span>
        );
      case 'holiday':
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
            <i className="bi bi-star me-1"></i> Holiday
          </span>
        );
      case 'weekend':
        return (
          <span className="badge bg-light text-secondary border px-2 py-1">
            Weekend
          </span>
        );
      default:
        return <span className="badge bg-light text-muted border px-2 py-1">—</span>;
    }
  };

  const summary = data?.summary || {
    present: 0,
    halfDay: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    totalHours: '0.0',
  };

  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthName = new Date(Number(yearStr), Number(monthStr) - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">My Attendance</h2>
          <p className="text-secondary small mb-0">
            Track daily work check-ins, working hours, and monthly summaries
          </p>
        </div>
      </div>

      {/* Clock & Action Widget */}
      <AttendanceWidget onRefresh={fetchAttendance} />

      {/* Monthly Filter Bar */}
      <div className="card shadow-sm border-0 mb-4 bg-white">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={handlePrevMonth}>
                <i className="bi bi-chevron-left"></i>
              </button>
              <h5 className="fw-bold text-dark mb-0 px-2">{monthName}</h5>
              <button className="btn btn-outline-secondary btn-sm" onClick={handleNextMonth}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>

            <div className="d-flex align-items-center gap-2">
              <label className="small text-muted fw-semibold">Select Month:</label>
              <input
                type="month"
                className="form-control form-control-sm w-auto"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => setSelectedMonth(currentMonthKey)}
              >
                Current Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-3 text-center">
              <span className="text-muted small fw-semibold text-uppercase">Present Days</span>
              <h3 className="fw-bold text-success mb-0 mt-1">{summary.present}</h3>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-3 text-center">
              <span className="text-muted small fw-semibold text-uppercase">Total Hours</span>
              <h3 className="fw-bold text-primary mb-0 mt-1">{summary.totalHours}h</h3>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-3 text-center">
              <span className="text-muted small fw-semibold text-uppercase">Late Arrivals</span>
              <h3 className="fw-bold text-warning mb-0 mt-1">{summary.late}</h3>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-3 text-center">
              <span className="text-muted small fw-semibold text-uppercase">Half Days</span>
              <h3 className="fw-bold text-info mb-0 mt-1">{summary.halfDay}</h3>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-3 text-center">
              <span className="text-muted small fw-semibold text-uppercase">Absent Days</span>
              <h3 className="fw-bold text-danger mb-0 mt-1">{summary.absent}</h3>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-3 text-center">
              <span className="text-muted small fw-semibold text-uppercase">Leave Days</span>
              <h3 className="fw-bold text-secondary mb-0 mt-1">{summary.onLeave}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Attendance Log Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold text-dark mb-0">Daily Attendance Breakdown</h5>
          <span className="badge bg-light text-muted border">
            {data?.days?.length || 0} Days
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small text-uppercase">
              <tr>
                <th className="ps-4">Date</th>
                <th>Day</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Total Worked</th>
                <th className="pe-4">Remarks / Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading attendance records...
                  </td>
                </tr>
              ) : !data?.days || data.days.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                data.days.map((d) => {
                  const hasRecord = !!d.record;
                  return (
                    <tr
                      key={d.date}
                      className={
                        d.isWeekend
                          ? 'table-light text-muted'
                          : d.isHoliday
                          ? 'table-warning-subtle'
                          : ''
                      }
                    >
                      <td className="ps-4 fw-semibold text-dark">{d.date}</td>
                      <td>
                        <span className="small text-secondary">{d.dayOfWeek}</span>
                      </td>
                      <td>{getStatusBadge(d.derivedStatus, d.record)}</td>
                      <td>
                        {hasRecord && d.record.checkIn ? (
                          <div className="d-flex align-items-center gap-1">
                            <span>{formatTime(d.record.checkIn)}</span>
                            {d.record.isLate && (
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
                        {hasRecord && d.record.checkOut ? (
                          formatTime(d.record.checkOut)
                        ) : hasRecord && !d.record.checkOut ? (
                          <span className="badge bg-secondary-subtle text-secondary small">
                            Missing Check-out
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {hasRecord && d.record.workedMinutes ? (
                          <span className="fw-semibold text-dark">
                            {formatHours(d.record.workedMinutes)}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="pe-4 small text-secondary">
                        {d.isHoliday && (
                          <span className="text-warning-emphasis fw-medium">
                            {d.holidayName || 'Public Holiday'}
                          </span>
                        )}
                        {d.hasApprovedLeave && (
                          <span className="text-purple fw-medium">
                            Approved Leave ({d.leaveType})
                          </span>
                        )}
                        {hasRecord && d.record.note && (
                          <span className="d-block text-muted">{d.record.note}</span>
                        )}
                        {hasRecord && d.record.correctedBy && (
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
