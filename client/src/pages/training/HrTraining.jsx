import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getPrograms, getTrainingSummary } from '../../api/training.js';

export default function HrTraining() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [progRes, sumRes] = await Promise.all([
        getPrograms({
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          q: searchQuery || undefined,
          page,
          limit: 15,
        }),
        getTrainingSummary().catch(() => null),
      ]);
      setPrograms(progRes.programs || []);
      setTotalPages(progRes.totalPages || 1);
      setTotal(progRes.total || 0);
      if (sumRes) setSummary(sumRes);
    } catch (err) {
      console.error('Failed to load HR training overview', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="badge bg-secondary-subtle text-secondary border">Draft</span>;
      case 'scheduled':
        return <span className="badge bg-info-subtle text-info border border-info-subtle">Scheduled</span>;
      case 'ongoing':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Ongoing</span>;
      case 'completed':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">Completed</span>;
      case 'cancelled':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Cancelled</span>;
      default:
        return <span className="badge bg-light text-dark border">{status}</span>;
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Company Training & Skill Development</h2>
        <p className="text-secondary small mb-0">
          Organization-wide training program catalog, enrollment monitoring, and completion analytics
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 rounded-4 p-3 bg-white h-100">
            <span className="text-muted small fw-semibold text-uppercase">Total Programs</span>
            <h3 className="fw-bold text-dark mb-0 mt-1">{summary?.totalPrograms || total}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 rounded-4 p-3 bg-white h-100">
            <span className="text-muted small fw-semibold text-uppercase">Total Enrollments</span>
            <h3 className="fw-bold text-primary mb-0 mt-1">{summary?.totalEnrollments || 0}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 rounded-4 p-3 bg-white h-100">
            <span className="text-muted small fw-semibold text-uppercase">Completions</span>
            <h3 className="fw-bold text-success mb-0 mt-1">{summary?.completedEnrollments || 0}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 rounded-4 p-3 bg-white h-100">
            <span className="text-muted small fw-semibold text-uppercase">Completion Rate</span>
            <h3 className="fw-bold text-info mb-0 mt-1">{summary?.completionRate || 0}%</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by title, description, or instructor..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                <option value="technical">Technical</option>
                <option value="soft_skills">Soft Skills</option>
                <option value="compliance">Compliance</option>
                <option value="leadership">Leadership</option>
                <option value="onboarding">Onboarding</option>
              </select>
            </div>

            <div className="col-12 col-md-1">
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setTypeFilter('');
                  setPage(1);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Programs Table */}
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold text-dark mb-0">Programs Directory ({total})</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchData}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small text-uppercase">
              <tr>
                <th className="ps-4">Program Title</th>
                <th>Manager / Creator</th>
                <th>Category</th>
                <th>Mode</th>
                <th>Dates</th>
                <th>Enrollment</th>
                <th>Status</th>
                <th className="pe-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading training programs...
                  </td>
                </tr>
              ) : programs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    No training programs match your filter criteria.
                  </td>
                </tr>
              ) : (
                programs.map((p) => {
                  const enrolled = p.enrolledCount || 0;
                  const pct = Math.min(100, Math.round((enrolled / p.capacity) * 100));

                  return (
                    <tr key={p._id}>
                      <td className="ps-4">
                        <div className="fw-semibold text-dark">{p.title}</div>
                        <div className="small text-muted text-truncate" style={{ maxWidth: '240px' }}>
                          {p.description}
                        </div>
                      </td>
                      <td>
                        <div className="fw-medium text-dark">{p.createdBy?.name || 'Manager'}</div>
                        <div className="small text-muted">{p.createdBy?.employeeCode}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border text-capitalize">
                          {p.type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border text-capitalize">
                          {p.mode}
                        </span>
                      </td>
                      <td className="small text-secondary">
                        {new Date(p.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} –{' '}
                        {new Date(p.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ minWidth: '120px' }}>
                        <div className="small fw-semibold text-dark mb-1">
                          {enrolled} / {p.capacity} ({pct}%)
                        </div>
                        <div className="progress" style={{ height: '5px' }}>
                          <div
                            className={`progress-bar ${pct >= 100 ? 'bg-danger' : 'bg-primary'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </td>
                      <td>{getStatusBadge(p.status)}</td>
                      <td className="pe-4 text-end">
                        <button
                          className="btn btn-outline-primary btn-sm rounded-3"
                          onClick={() => navigate(`/trainings/${p._id}`)}
                        >
                          View Roster &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex justify-content-between align-items-center">
            <span className="small text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
