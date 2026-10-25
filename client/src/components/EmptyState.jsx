export default function EmptyState({
  icon = 'bi-inbox',
  title = 'No items found',
  description = 'There are no records to display at this time.',
  action,
}) {
  return (
    <div className="text-center py-5 px-3">
      <div className="d-inline-flex align-items-center justify-content-center bg-light text-muted rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
        <i className={`bi ${icon} fs-2`}></i>
      </div>
      <h5 className="fw-semibold text-dark mb-1">{title}</h5>
      <p className="text-muted small mx-auto mb-3" style={{ maxWidth: '360px' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
