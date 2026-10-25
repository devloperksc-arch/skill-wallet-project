import Form from 'react-bootstrap/Form';

export default function FormField({
  label,
  error,
  required = false,
  helperText,
  id,
  children,
  className = 'mb-3',
}) {
  return (
    <Form.Group className={className} controlId={id}>
      {label && (
        <Form.Label className="fw-semibold form-label-sm">
          {label} {required && <span className="text-danger">*</span>}
        </Form.Label>
      )}
      {children}
      {helperText && !error && (
        <Form.Text className="text-muted small">{helperText}</Form.Text>
      )}
      {error && <Form.Control.Feedback type="invalid" className="d-block">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
}
