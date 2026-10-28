import React, { useState, useEffect } from 'react';
import { getTodayStatus, checkIn, checkOut } from '../../api/attendance.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AttendanceWidget({ onRefresh }) {
  const { showToast } = useToast();
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await getTodayStatus();
      setStatusData(data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not load today\'s attendance status', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await checkIn();
      showToast('Checked in successfully', 'success');
      await loadStatus();
      onRefresh?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Check-in failed', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await checkOut();
      showToast('Checked out successfully', 'success');
      await loadStatus();
      onRefresh?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Check-out failed', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const record = statusData?.record;
  const isCheckedIn = !!record?.checkIn;
  const isCheckedOut = !!record?.checkOut;

  // Calculate live elapsed worked time
  let liveWorkedText = '0h 0m';
  if (isCheckedIn) {
    const startMs = new Date(record.checkIn).getTime();
    const endMs = isCheckedOut ? new Date(record.checkOut).getTime() : currentTime.getTime();
    const totalMinutes = Math.max(0, Math.floor((endMs - startMs) / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    liveWorkedText = `${hours}h ${mins}m`;
  }

  const timeFormatted = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateFormatted = currentTime.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="card shadow-sm border-0 mb-4 overflow-hidden position-relative bg-white">
      <div className="card-body p-4">
        <div className="row g-4 align-items-center">
          {/* Clock & Date Banner */}
          <div className="col-12 col-md-5 border-end-md">
            <div className="d-flex align-items-center gap-2 text-primary mb-1">
              <i className="bi bi-clock-history fs-5"></i>
              <span className="small fw-bold text-uppercase tracking-wider">Attendance Clock</span>
            </div>
            <div className="display-5 fw-bold text-dark font-monospace mb-1">{timeFormatted}</div>
            <div className="text-muted small mb-3">{dateFormatted}</div>

            {/* Badges */}
            <div className="d-flex flex-wrap gap-2">
              {record?.isLate && (
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  Marked Late
                </span>
              )}
              {record?.note?.includes('non-working day') && (
                <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">
                  Non-Working Day
                </span>
              )}
              {record?.status && (
                <span
                  className={`badge px-2 py-1 ${
                    record.status === 'present'
                      ? 'bg-success-subtle text-success border border-success-subtle'
                      : record.status === 'half-day'
                      ? 'bg-warning-subtle text-warning border border-warning-subtle'
                      : 'bg-danger-subtle text-danger border border-danger-subtle'
                  }`}
                >
                  Status: {record.status}
                </span>
              )}
            </div>
          </div>

          {/* Action & Stats Panel */}
          <div className="col-12 col-md-7">
            <div className="row g-3 mb-4 text-center">
              <div className="col-4">
                <div
                  className="p-3 rounded-3 border h-100 d-flex flex-column justify-content-center"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.12)' }}
                >
                  <span className="text-slate-400 small font-overline">Check In</span>
                  <span className="fw-bold text-white fs-5 mt-1 font-monospace">
                    {record?.checkIn
                      ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="col-4">
                <div
                  className="p-3 rounded-3 border h-100 d-flex flex-column justify-content-center"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.12)' }}
                >
                  <span className="text-slate-400 small font-overline">Check Out</span>
                  <span className="fw-bold text-white fs-5 mt-1 font-monospace">
                    {record?.checkOut
                      ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="col-4">
                <div
                  className="p-3 rounded-3 border h-100 d-flex flex-column justify-content-center"
                  style={{ background: 'rgba(99, 102, 241, 0.12)', borderColor: 'rgba(99, 102, 241, 0.28)' }}
                >
                  <span className="text-indigo-300 small font-overline">Worked Hours</span>
                  <span className="fw-bold text-indigo-200 fs-5 mt-1 font-monospace">
                    {liveWorkedText}
                  </span>
                </div>
              </div>
            </div>

            {/* Check-in / Check-out Button Controls */}
            <div className="d-flex gap-3">
              {statusData?.canCheckIn && (
                <button
                  className="btn btn-primary btn-lg w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  onClick={handleCheckIn}
                  disabled={actionLoading || loading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right fs-4"></i>
                      Check In Now
                    </>
                  )}
                </button>
              )}

              {statusData?.canCheckOut && (
                <button
                  className="btn btn-warning btn-lg w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  onClick={handleCheckOut}
                  disabled={actionLoading || loading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-right fs-4"></i>
                      Check Out Now
                    </>
                  )}
                </button>
              )}

              {isCheckedIn && isCheckedOut && (
                <div className="alert alert-success border-success-subtle w-100 mb-0 py-3 text-center fw-semibold">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Attendance marked for today. All check-ins and check-outs complete!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
