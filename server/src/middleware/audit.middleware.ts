import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';
import { logger } from '../config/logger';

/**
 * Audit logging middleware — logs all mutating requests.
 */
export async function auditMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const originalJson = res.json.bind(res);

  res.json = function (body: unknown) {
    // Log after response is sent
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && req.user) {
      const logEntry = {
        actor: req.user.userId,
        action: `${req.method} ${req.path}`,
        entity: req.path.split('/')[1] || 'unknown',
        entityId: req.params.id || 'unknown',
        metadata: {
          statusCode: res.statusCode,
          body: sanitizeForLog(body),
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      };

      AuditLog.create(logEntry).catch((err) => {
        logger.error('Failed to create audit log', { error: err.message });
      });
    }

    return originalJson(body);
  };

  next();
}

function sanitizeForLog(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) return body;
  const sanitized = { ...(body as Record<string, unknown>) };
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.token;
  delete sanitized.accessToken;
  delete sanitized.refreshToken;
  return sanitized;
}
