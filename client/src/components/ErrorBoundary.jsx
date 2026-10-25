import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
          <div className="card shadow-sm border-0 p-4 text-center" style={{ maxWidth: '480px' }}>
            <div className="text-danger mb-3">
              <i className="bi bi-exclamation-triangle-fill fs-1"></i>
            </div>
            <h4 className="fw-bold mb-2">Something went wrong</h4>
            <p className="text-muted small mb-4">
              An unexpected error occurred in the application. Please try reloading the page.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button className="btn btn-primary px-4" onClick={this.handleReload}>
                <i className="bi bi-arrow-clockwise me-1"></i> Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
