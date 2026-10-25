const STATUS_MAP = {
  pending:   { label: 'Pending',   cls: 'badge-pending' },
  approved:  { label: 'Approved',  cls: 'badge-approved' },
  rejected:  { label: 'Rejected',  cls: 'badge-rejected' },
  cancelled: { label: 'Cancelled', cls: 'badge-cancelled' },
  'half-day':{ label: 'Half Day',  cls: 'badge-half-day' },
  present:   { label: 'Present',   cls: 'badge-present' },
  absent:    { label: 'Absent',    cls: 'badge-absent' },
  active:    { label: 'Active',    cls: 'badge-active' },
  inactive:  { label: 'Inactive',  cls: 'badge-inactive' },
  hr:        { label: 'HR',        cls: 'badge-hr' },
  manager:   { label: 'Manager',   cls: 'badge-manager' },
  employee:  { label: 'Employee',  cls: 'badge-employee' },
  draft:     { label: 'Draft',     cls: 'badge-cancelled' },
  scheduled: { label: 'Scheduled', cls: 'badge-pending' },
  ongoing:   { label: 'Ongoing',   cls: 'badge-half-day' },
  completed: { label: 'Completed', cls: 'badge-approved' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || { label: status, cls: 'badge-cancelled' };
  return (
    <span className={`badge ${cfg.cls}`} style={{ fontWeight: 500 }}>
      {cfg.label}
    </span>
  );
}
