import { Request } from 'express';
import { AuditLog } from '../models/AuditLog';

export async function audit(
  req: Request,
  action: string,
  entity: string,
  entityId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  if (!req.user) return;
  await AuditLog.create({
    actor: req.user.userId,
    action,
    entity,
    entityId,
    changes,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });
}
