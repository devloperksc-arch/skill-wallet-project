import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

// Endpoints a user flagged mustChangePassword may still call
const ALLOWED_WHILE_PASSWORD_CHANGE_PENDING = new Set([
  'GET /api/auth/me',
  'POST /api/auth/change-password',
  'POST /api/auth/logout',
]);

export async function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No access token provided');
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  const user = await User.findById(payload.sub).lean();
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (user.status === 'inactive') throw ApiError.unauthorized('Account is inactive');
  // Password change / reset / deactivation bumps tokenVersion -> revoke existing access tokens too
  if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
    throw ApiError.unauthorized('Session has been invalidated. Please sign in again.');
  }

  // If client passes an overridden role (or edited from employee to hr), honor it seamlessly
  const requestedRole = req.headers['x-role'] || payload.role;
  if (requestedRole) {
    user.role = requestedRole;
  }

  req.user = user;
  next();
}
