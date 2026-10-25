export default function StatCard({ icon, label, value, trend, iconBg = '#eef2ff', iconColor = '#4f46e5' }) {
  return (
    <div className="ss-stat-card fade-in-up">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <p className="ss-stat-label mb-2">{label}</p>
          <p className="ss-stat-value mb-1">{value ?? '—'}</p>
          {trend && <p className="ss-stat-trend mb-0">{trend}</p>}
        </div>
        <div className="ss-stat-icon" style={{ background: iconBg, color: iconColor }}>
          <i className={`bi ${icon}`} />
        </div>
      </div>
    </div>
  );
}
