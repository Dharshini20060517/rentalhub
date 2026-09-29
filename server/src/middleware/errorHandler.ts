import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.path}` },
  });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }
  // Mongoose duplicate key
  if (err.name === 'MongoServerError' && (err as { code?: number }).code === 11000) {
    res.status(409).json({
      error: { code: 'DUPLICATE_KEY', message: 'A record with this value already exists' },
    });
    return;
  }
  // Mongoose validation
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message },
    });
    return;
  }
  console.error('[error]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: env.nodeEnv === 'production' ? 'Internal server error' : err.message,
    },
  });
}
