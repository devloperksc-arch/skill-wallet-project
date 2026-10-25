import EmptyState from './EmptyState.jsx';
import Spinner from 'react-bootstrap/Spinner';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  pagination = null,
  onPageChange = null,
  sortBy = null,
  sortOrder = 'desc',
  onSort = null,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria.',
  emptyIcon = 'bi-inbox',
}) {
  const handleSort = (key) => {
    if (!onSort) return;
    const nextOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(key, nextOrder);
  };

  const startEntry = pagination ? (pagination.page - 1) * pagination.limit + 1 : 1;
  const endEntry = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : data.length;

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0" style={{ minWidth: '650px' }}>
          <thead className="table-light border-bottom">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-uppercase text-muted py-3 px-3 fw-semibold ${col.className || ''}`}
                  style={{
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="d-flex align-items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-secondary small">
                        {sortBy === col.key ? (
                          sortOrder === 'asc' ? (
                            <i className="bi bi-arrow-up text-primary"></i>
                          ) : (
                            <i className="bi bi-arrow-down text-primary"></i>
                          )
                        ) : (
                          <i className="bi bi-arrow-down-up opacity-25"></i>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-5">
                  <Spinner animation="border" variant="primary" role="status" className="mb-2" />
                  <div className="text-muted small">Loading records...</div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-4">
                  <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row._id || idx}>
                  {columns.map((col) => (
                    <td key={col.key} className={`px-3 py-3 ${col.tdClassName || ''}`}>
                      {col.render ? col.render(row, idx) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="card-footer bg-white border-top py-3 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <small className="text-muted">
            Showing <span className="fw-semibold text-dark">{pagination.total > 0 ? startEntry : 0}</span> to{' '}
            <span className="fw-semibold text-dark">{endEntry}</span> of{' '}
            <span className="fw-semibold text-dark">{pagination.total}</span> entries
          </small>

          <div className="d-flex align-items-center gap-1">
            <button
              className="btn btn-outline-secondary btn-sm px-2 py-1 rounded-2"
              disabled={pagination.page <= 1 || loading}
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              aria-label="Previous page"
            >
              <i className="bi bi-chevron-left me-1"></i> Prev
            </button>
            <span className="mx-2 small text-muted">
              Page <strong className="text-dark">{pagination.page}</strong> of{' '}
              <strong className="text-dark">{pagination.totalPages}</strong>
            </span>
            <button
              className="btn btn-outline-secondary btn-sm px-2 py-1 rounded-2"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              aria-label="Next page"
            >
              Next <i className="bi bi-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
