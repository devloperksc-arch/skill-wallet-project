import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export default function ResetPasswordModal({
  show,
  onClose,
  employeeName,
  temporaryPassword,
  isNewUser = false,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="h5 mb-0">
          <i className="bi bi-key-fill text-warning me-2"></i>
          {isNewUser ? 'Employee Account Created' : 'Password Reset Successfully'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <p className="text-muted small mb-3">
          A temporary password has been generated for <strong>{employeeName || 'this employee'}</strong>. They will be forced to change it on their first login.
        </p>

        <div className="alert alert-warning py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0 fs-5"></i>
          <div>
            <strong>Important:</strong> This password is only shown once and cannot be retrieved later. Copy it now!
          </div>
        </div>

        <div className="bg-light border rounded-3 p-3 d-flex align-items-center justify-content-between mb-2">
          <code className="fs-5 fw-bold text-dark user-select-all tracking-wide">
            {temporaryPassword}
          </code>
          <Button
            variant={copied ? 'success' : 'outline-primary'}
            size="sm"
            onClick={handleCopy}
            className="d-flex align-items-center gap-1 rounded-2"
          >
            <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onClose} className="px-4 rounded-3">
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
