import React from 'react';

/**
 * Headcount by Department Bar Chart
 */
export function DepartmentBarChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-4 text-muted small">No department headcount data available.</div>;
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 180;
  const barWidth = 36;
  const gap = 24;
  const svgWidth = Math.max(320, data.length * (barWidth + gap) + 40);

  return (
    <div className="w-100 overflow-x-auto py-2">
      <svg
        viewBox={`0 0 ${svgWidth} ${chartHeight + 40}`}
        className="w-100"
        style={{ minWidth: `${svgWidth}px`, height: '220px' }}
        role="img"
        aria-label="Department headcount distribution bar chart"
      >
        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = chartHeight - pct * (chartHeight - 20) + 10;
          return (
            <g key={idx}>
              <line x1="30" y1={y} x2={svgWidth - 10} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x="25" y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
                {Math.round(pct * maxVal)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const x = 40 + idx * (barWidth + gap);
          const barH = (item.count / maxVal) * (chartHeight - 20);
          const y = chartHeight - barH + 10;

          return (
            <g key={item.department} className="transition-all">
              <defs>
                <linearGradient id={`barGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx="6"
                fill={`url(#barGrad-${idx})`}
              />
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#1e293b"
              >
                {item.count}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 25}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                className="text-truncate"
              >
                {item.department.length > 10 ? `${item.department.slice(0, 9)}…` : item.department}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Leave Requests by Status Donut Chart
 */
export function LeaveStatusDonutChart({ data = { pending: 0, approved: 0, rejected: 0, cancelled: 0 } }) {
  const slices = [
    { label: 'Approved', count: data.approved || 0, color: '#10b981' },
    { label: 'Pending', count: data.pending || 0, color: '#f59e0b' },
    { label: 'Rejected', count: data.rejected || 0, color: '#ef4444' },
    { label: 'Cancelled', count: data.cancelled || 0, color: '#94a3b8' },
  ];

  const total = slices.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) {
    return <div className="text-center py-4 text-muted small">No leave requests recorded this year.</div>;
  }

  // Calculate SVG stroke-dasharray segments
  const size = 160;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-center gap-4 py-2">
      <div className="position-relative" style={{ width: `${size}px`, height: `${size}px` }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform-rotate-neg90"
          style={{ transform: 'rotate(-90deg)' }}
          role="img"
          aria-label="Leave requests status donut chart"
        >
          {slices.map((slice, idx) => {
            const percent = slice.count / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -(accumulatedPercent * circumference);
            accumulatedPercent += percent;

            if (slice.count === 0) return null;

            return (
              <circle
                key={slice.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div
          className="position-absolute top-50 start-50 translate-middle text-center"
          style={{ pointerEvents: 'none' }}
        >
          <div className="fw-bold fs-4 text-dark mb-0 lh-1">{total}</div>
          <small className="text-muted" style={{ fontSize: '0.7rem' }}>Total</small>
        </div>
      </div>

      {/* Legend */}
      <div className="d-flex flex-column gap-2">
        {slices.map((s) => (
          <div key={s.label} className="d-flex align-items-center gap-2 small">
            <span
              className="rounded-circle d-inline-block"
              style={{ width: '10px', height: '10px', backgroundColor: s.color }}
            ></span>
            <span className="text-secondary">{s.label}:</span>
            <span className="fw-bold text-dark">{s.count}</span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              ({Math.round((s.count / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 30-Day Attendance Trend Line Chart
 */
export function AttendanceTrendLineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-4 text-muted small">No attendance trend data available.</div>;
  }

  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  const points = data.map((d, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (d.rate / 100) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${
    height - paddingY
  } Z`;

  return (
    <div className="w-100 overflow-x-auto py-2">
      <svg
        viewBox={`0 0 ${width} ${height + 30}`}
        className="w-100"
        style={{ minWidth: '480px', height: '210px' }}
        role="img"
        aria-label="30-day attendance percentage rate trend line chart"
      >
        <defs>
          <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 25, 50, 75, 100].map((rate) => {
          const y = height - paddingY - (rate / 100) * (height - 2 * paddingY);
          return (
            <g key={rate}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={paddingX - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
                {rate}%
              </text>
            </g>
          );
        })}

        {/* Gradient Area Fill */}
        <path d={areaD} fill="url(#trendAreaGrad)" />

        {/* Primary Line */}
        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />

        {/* Sample Point Markers & Dates */}
        {points.map((p, idx) => {
          if (idx % 5 === 0 || idx === points.length - 1) {
            return (
              <g key={p.date}>
                <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                <text
                  x={p.x}
                  y={height + 15}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                >
                  {p.date.slice(5)}
                </text>
              </g>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}
