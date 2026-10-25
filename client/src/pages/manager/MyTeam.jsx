import { useState, useEffect, useCallback } from 'react';
import { employeeApi } from '../../api/employees.js';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from 'react-bootstrap/Spinner';

export default function MyTeam() {
  const { showToast } = useToast();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employeeApi.getTeam();
      setTeam(res.data.data || []);
    } catch (err) {
      showToast('Failed to load team members', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return (
    <div>
      <PageHeader
        title="My Team"
        subtitle="Manage and view all direct reports assigned to your management line"
        breadcrumb={[
          { label: 'Dashboard', path: '/manager' },
          { label: 'My Team', active: true },
        ]}
      />

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="text-muted small mt-2">Loading team members...</div>
        </div>
      ) : team.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <EmptyState
            icon="bi-people"
            title="No direct reports found"
            description="You do not currently have any active team members reporting to you."
          />
        </div>
      ) : (
        <div className="row g-4">
          {team.map((member) => (
            <div key={member._id} className="col-12 col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 hover-shadow transition">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5"
                    style={{ width: '48px', height: '48px', minWidth: '48px' }}
                  >
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="overflow-hidden">
                    <h6 className="fw-bold mb-0 text-dark text-truncate">{member.name}</h6>
                    <small className="text-muted text-truncate d-block">{member.designation || 'Staff'}</small>
                  </div>
                  <div className="ms-auto">
                    <StatusBadge status={member.status || 'active'} />
                  </div>
                </div>

                <div className="border-top pt-3 mt-auto">
                  <div className="d-flex justify-content-between small text-muted mb-2">
                    <span>Code:</span>
                    <span className="fw-semibold text-dark font-monospace">{member.employeeCode}</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted mb-2">
                    <span>Department:</span>
                    <span className="fw-semibold text-dark">{member.department?.name || '—'}</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted mb-2">
                    <span>Email:</span>
                    <span className="text-dark text-truncate ms-2" style={{ maxWidth: '180px' }}>{member.email}</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted">
                    <span>Phone:</span>
                    <span className="text-dark">{member.phone || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
