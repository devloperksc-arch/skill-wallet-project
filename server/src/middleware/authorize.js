import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware factory — only allows users whose role is in the allowed list.
 * Must be used AFTER authenticate().
 */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to access this resource');
    }
    next();
  };
}
