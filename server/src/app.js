import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { getDBStatus } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // Request logging (dev only)
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Global rate limit: 300 req / 15 min / IP
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Stricter rate limit on login: 10 / 15 min / IP
  app.use(
    '/api/auth/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Health check
  app.get('/api/health', (_req, res) => {
    const dbStatus = getDBStatus();
    const status = dbStatus === 'connected' ? 200 : 503;
    res.status(status).json({ status: 'ok', db: dbStatus });
  });

  // API Routes
  app.use('/api/auth', authRoutes);

  // 404 + error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
