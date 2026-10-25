import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

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

  req.user = user;
  next();
}
