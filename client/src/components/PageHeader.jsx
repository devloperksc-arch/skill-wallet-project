import { Link } from 'react-router';

/**
 * PageHeader – reusable top-of-page header with:
 *   - title (required)
 *   - subtitle (optional string)
 *   - breadcrumb (optional array of { label, path?, active? })
 *   - actions (optional JSX slot rendered right-side)
 *   - children (alias for actions, legacy support)
 */
export default function PageHeader({ title, subtitle, breadcrumb, actions, children }) {
  const actionSlot = actions ?? children;

  return (
    <div className="ss-page-header fade-in-up">
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
        <div>
          {/* Breadcrumb */}
          {breadcrumb && Array.isArray(breadcrumb) && breadcrumb.length > 0 && (
            <nav aria-label="breadcrumb" className="mb-1">
              <ol className="breadcrumb mb-0 small" style={{ fontSize: '0.78rem' }}>
                {breadcrumb.map((crumb, i) =>
                  crumb.active ? (
                    <li key={i} className="breadcrumb-item active text-muted" aria-current="page">
                      {crumb.label}
                    </li>
                  ) : (
                    <li key={i} className="breadcrumb-item">
                      {crumb.path ? (
                        <Link to={crumb.path} className="text-decoration-none text-primary-emphasis small">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-muted">{crumb.label}</span>
                      )}
                    </li>
                  )
                )}
              </ol>
            </nav>
          )}

          {/* Title */}
          <h1 className="ss-page-title mb-0">{title}</h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-muted small mb-0 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Action buttons slot */}
        {actionSlot && (
          <div className="d-flex gap-2 align-items-center flex-wrap flex-shrink-0">
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
}
