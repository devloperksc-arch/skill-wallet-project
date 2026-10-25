import React from 'react';

export default function LeaveBalanceCards({ balances = [] }) {
  if (!balances.length) {
    return (
      <div className="card shadow-sm border-0 mb-4 bg-light text-center py-4 text-muted">
        <i className="bi bi-calendar2-range fs-2 mb-2"></i>
        <p className="mb-0">No leave balance records available for this period.</p>
      </div>
    );
  }

  return (
    <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3 mb-4">
      {balances.map((b) => {
        const lt = b.leaveType || {};
        const isUnlimited = lt.isUnlimited;
        const allocated = isUnlimited ? '∞' : b.allocated;
        const available = isUnlimited ? 'Unlimited' : Math.max(0, b.allocated - b.used - b.pending);
        const usedPercent = !isUnlimited && b.allocated > 0
          ? Math.min(100, Math.round((b.used / b.allocated) * 100))
          : 0;

        return (
          <div key={b._id} className="col">
            <div className="card h-100 shadow-sm border-0 position-relative overflow-hidden">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold text-truncate me-2">{lt.name || 'Leave'}</span>
                  <span
                    className={`badge ${
                      lt.isPaid ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'
                    }`}
                  >
                    {lt.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>

                <div className="d-flex align-items-baseline mb-3">
                  <span className="display-6 fw-bold text-dark">{available}</span>
                  {!isUnlimited && <span className="text-muted ms-2 fs-6">days left</span>}
                </div>

                {!isUnlimited && (
                  <div className="progress mb-3" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-primary"
                      role="progressbar"
                      style={{ width: `${usedPercent}%` }}
                      aria-valuenow={usedPercent}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                )}

                <div className="row g-1 pt-2 border-top text-center fs-7 text-muted">
                  <div className="col-4">
                    <div className="fw-semibold text-dark">{allocated}</div>
                    <div className="small">Quota</div>
                  </div>
                  <div className="col-4 border-start border-end">
                    <div className="fw-semibold text-info">{b.used}</div>
                    <div className="small">Used</div>
                  </div>
                  <div className="col-4">
                    <div className="fw-semibold text-warning">{b.pending}</div>
                    <div className="small">Pending</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
