export default function SearchFilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  onFilterChange,
  onReset,
  actions,
}) {
  const hasActiveFilters = Boolean(
    searchValue || filters.some((f) => f.value && f.value !== '' && f.value !== 'all')
  );

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* Search & Filters */}
        <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
          {/* Search Box */}
          <div className="input-group" style={{ maxWidth: '280px' }}>
            <span className="input-group-text bg-white border-end-0 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchValue && (
              <button
                className="btn btn-outline-secondary border-start-0 border-end"
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          {filters.map((f) => (
            <select
              key={f.key}
              className="form-select text-secondary"
              style={{ maxWidth: '180px' }}
              value={f.value}
              onChange={(e) => onFilterChange(f.key, e.target.value)}
              aria-label={f.label}
            >
              <option value="">{f.label}: All</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {/* Clear button if any filter is active */}
          {hasActiveFilters && onReset && (
            <button
              className="btn btn-light text-muted btn-sm d-flex align-items-center gap-1 rounded-2"
              onClick={onReset}
              title="Reset all filters"
            >
              <i className="bi bi-x-circle"></i>
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Right Action buttons */}
        {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
