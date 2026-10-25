import { createContext, useContext, useState, useCallback, useId } from 'react';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, variant = 'success', delay = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant, delay }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, delay + 300);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'danger'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  const iconMap = {
    success: 'bi-check-circle-fill',
    danger: 'bi-x-circle-fill',
    info: 'bi-info-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 9999, position: 'fixed', top: 0, right: 0 }}
      >
        {toasts.map((t) => (
          <Toast key={t.id} bg={t.variant} delay={t.delay} autohide>
            <Toast.Body className="d-flex align-items-center gap-2 text-white fw-500">
              <i className={`bi ${iconMap[t.variant] || 'bi-bell-fill'}`} />
              {t.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
