import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../models/User';

export interface AuthPayload {
  userId: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token;
  if (!token) {
    return next(ApiError.unauthorized());
  }
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret) as AuthPayload;
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token;
  if (token) {
    try {
      const payload = jwt.verify(token, env.jwt.accessSecret) as AuthPayload;
      req.user = { userId: payload.userId, role: payload.role };
    } catch {
      // ignore — treat as unauthenticated
    }
  }
  next();
}
