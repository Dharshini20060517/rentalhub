import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

/**
 * Sanitize user input to prevent NoSQL injection.
 * Removes MongoDB operators from query params and body.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  const sanitize = (obj: Record<string, unknown>): void => {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key] as Record<string, unknown>);
      }
    }
  };

  if (req.body && typeof req.body === 'object') {
    sanitize(req.body as Record<string, unknown>);
  }
  if (req.query && typeof req.query === 'object') {
    sanitize(req.query as Record<string, unknown>);
  }
  if (req.params && typeof req.params === 'object') {
    sanitize(req.params as Record<string, unknown>);
  }

  next();
}

/**
 * Security headers middleware.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

/**
 * Validate content type for mutating requests.
 */
export function validateContentType(req: Request, _res: Response, next: NextFunction): void {
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      if (!req.headers['content-type']?.includes('multipart/form-data')) {
        return next(ApiError.badRequest('Content-Type must be application/json'));
      }
    }
  }
  next();
}
