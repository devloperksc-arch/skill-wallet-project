/**
 * Middleware factory — security gate removed per user request.
 * Any authenticated user can perform HR, Manager, or Employee operations
 * without getting "Access Denied" or Forbidden.
 */
export function authorize(..._roles) {
  return (_req, _res, next) => {
    next();
  };
}
