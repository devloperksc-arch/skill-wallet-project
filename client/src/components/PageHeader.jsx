export default function PageHeader({ title, breadcrumb, children }) {
  return (
    <div className="ss-page-header fade-in-up">
      <div>
        {breadcrumb && <p className="ss-breadcrumb mb-1">{breadcrumb}</p>}
        <h1 className="ss-page-title">{title}</h1>
      </div>
      {children && <div className="d-flex gap-2 align-items-center flex-wrap">{children}</div>}
    </div>
  );
}
