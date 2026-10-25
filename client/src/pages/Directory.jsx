import { useState, useEffect, useCallback } from 'react';
import { employeeApi } from '../api/employees.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Spinner from 'react-bootstrap/Spinner';

export default function Directory() {
  const { showToast } = useToast();
  const [colleagues, setColleagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDirectory = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.q = search.trim();
      const res = await employeeApi.getDirectory(params);
      setColleagues(res.data.data || []);
    } catch (err) {
      showToast('Failed to load employee directory', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDirectory();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchDirectory]);

  return (
    <div>
      <PageHeader
        title="Organization Directory"
        subtitle="Connect with teammates and colleagues across all departments"
      />

      {/* Search Input Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
        <div className="input-group" style={{ maxWidth: '360px' }}>
          <span className="input-group-text bg-white border-end-0 text-muted">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Search by name, designation, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="btn btn-outline-secondary border-start-0"
              onClick={() => setSearch('')}
              type="button"
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="text-muted small mt-2">Loading directory...</div>
        </div>
      ) : colleagues.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <EmptyState
            icon="bi-people"
            title="No colleagues found"
            description="No active employees matched your search query."
          />
        </div>
      ) : (
        <div className="row g-3">
          {colleagues.map((emp) => (
            <div key={emp._id} className="col-12 col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 hover-shadow transition">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: '46px', height: '46px', minWidth: '46px' }}
                  >
                    {emp.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="overflow-hidden">
                    <h6 className="fw-bold mb-0 text-dark text-truncate">{emp.name}</h6>
                    <small className="text-muted text-truncate d-block">{emp.designation || 'Staff'}</small>
                  </div>
                </div>

                <div className="bg-light-subtle rounded-3 p-3 mt-auto">
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Department:</span>
                    <span className="fw-semibold text-dark">{emp.department?.name || '—'}</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted mb-1">
                    <span>Email:</span>
                    <a href={`mailto:${emp.email}`} className="text-primary text-decoration-none text-truncate ms-2" style={{ maxWidth: '180px' }}>
                      {emp.email}
                    </a>
                  </div>
                  {emp.phone && (
                    <div className="d-flex justify-content-between small text-muted">
                      <span>Phone:</span>
                      <span className="text-dark">{emp.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
