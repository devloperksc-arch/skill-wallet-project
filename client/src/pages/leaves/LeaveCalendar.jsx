import React, { useState, useEffect, useCallback } from 'react';
import { getLeaveCalendar } from '../../api/leaves.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function LeaveCalendar() {
  const { showToast } = useToast();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [calendarData, setCalendarData] = useState({ holidays: [], leaves: [] });
  const [loading, setLoading] = useState(true);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeaveCalendar(selectedMonth);
      setCalendarData(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load leave calendar', 'danger');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, showToast]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const prev = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prev);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(next);
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(currentMonthStr);
  };

  // Build grid days for the selected month
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const firstDayOfWeek = new Date(yearNum, monthNum - 1, 1).getDay(); // 0 is Sunday

  const monthName = new Date(yearNum, monthNum - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays = [];
  // Empty pad for days before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push({ empty: true, key: `empty-${i}` });
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(yearNum, monthNum - 1, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Check holidays
    const holidaysOnDay = calendarData.holidays.filter((h) => h.date === dateKey);

    // Check approved leaves covering this day
    const leavesOnDay = calendarData.leaves.filter((l) => {
      return dateKey >= l.startDate && dateKey <= l.endDate;
    });

    calendarDays.push({
      dateKey,
      day,
      isWeekend,
      isToday: dateKey === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      holidays: holidaysOnDay,
      leaves: leavesOnDay,
      key: dateKey,
    });
  }

  return (
    <div className="container-fluid py-2">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">Leave & Holiday Calendar</h2>
          <p className="text-muted mb-0">
            Overview of approved team leaves and official company holidays.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary" onClick={handlePrevMonth}>
            <i className="bi bi-chevron-left"></i>
          </button>
          <span className="fw-bold px-2 fs-5" style={{ minWidth: '170px', textAlign: 'center' }}>
            {monthName}
          </span>
          <button className="btn btn-outline-secondary" onClick={handleNextMonth}>
            <i className="bi bi-chevron-right"></i>
          </button>
          <button className="btn btn-outline-primary ms-2" onClick={handleCurrentMonth}>
            Current Month
          </button>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="card shadow-sm border-0 mb-4 overflow-hidden">
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Loading calendar data…</p>
          </div>
        )}

        {!loading && (
          <div className="table-responsive">
            {/* Days of week header */}
            <div
              className="d-grid text-center fw-bold bg-light py-2 border-bottom"
              style={{ gridTemplateColumns: 'repeat(7, 1fr)', fontSize: '0.9rem' }}
            >
              <div className="text-danger">Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div className="text-danger">Sat</div>
            </div>

            {/* Calendar Grid */}
            <div
              className="d-grid"
              style={{
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '1px',
                backgroundColor: '#e9ecef',
              }}
            >
              {calendarDays.map((cell) => {
                if (cell.empty) {
                  return (
                    <div
                      key={cell.key}
                      className="bg-light p-2"
                      style={{ minHeight: '110px' }}
                    ></div>
                  );
                }

                return (
                  <div
                    key={cell.key}
                    className={`p-2 d-flex flex-column justify-content-between ${
                      cell.isToday
                        ? 'bg-primary-subtle border border-primary'
                        : cell.isWeekend
                        ? 'bg-light text-muted'
                        : 'bg-white'
                    }`}
                    style={{ minHeight: '110px' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span
                        className={`badge ${
                          cell.isToday
                            ? 'bg-primary text-white rounded-circle'
                            : cell.isWeekend
                            ? 'text-danger'
                            : 'text-dark'
                        } fs-7`}
                      >
                        {cell.day}
                      </span>
                      {cell.isToday && <span className="small text-primary fw-bold">Today</span>}
                    </div>

                    <div className="d-flex flex-column gap-1 overflow-auto" style={{ maxHeight: '75px' }}>
                      {/* Holidays */}
                      {cell.holidays.map((h) => (
                        <div
                          key={h._id}
                          className="badge bg-danger text-wrap text-start py-1 px-2"
                          title={h.name}
                        >
                          <i className="bi bi-star-fill me-1 small"></i>
                          {h.name}
                        </div>
                      ))}

                      {/* Leaves */}
                      {cell.leaves.map((l) => (
                        <div
                          key={l._id}
                          className="badge bg-primary-subtle text-primary border border-primary-subtle text-wrap text-start py-1 px-2"
                          title={`${l.user?.name || 'Employee'} (${l.leaveType?.name || 'Leave'})`}
                        >
                          <i className="bi bi-person-fill me-1"></i>
                          {l.user?.name || 'Employee'}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card shadow-sm border-0 p-3 bg-light">
        <div className="d-flex flex-wrap align-items-center gap-3 small text-muted">
          <span className="fw-bold text-dark">Legend:</span>
          <div className="d-flex align-items-center gap-1">
            <span className="badge bg-danger px-2 py-1">Holiday</span>
            <span>Official Holiday</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
              Employee Name
            </span>
            <span>Approved Leave</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span className="badge bg-primary rounded-circle px-2">●</span>
            <span>Current Date</span>
          </div>
        </div>
      </div>
    </div>
  );
}
