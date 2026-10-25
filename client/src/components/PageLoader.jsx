export default function PageLoader() {
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh', background: '#f5f7fb' }}
      role="status"
      aria-label="Loading"
    >
      <div className="text-center">
        <div
          style={{
            width: 48,
            height: 48,
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #4f46e5',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <p className="text-secondary small">Loading…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
