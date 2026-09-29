import { User, UserRole, IUser } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { generateAccessToken, generateRefreshToken, TokenPayload } from './token.service';
import { ApiError } from '../utils/ApiError';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

function setTokenCookies(res: import('express').Response, payload: TokenPayload): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(ACCESS_TOKEN_COOKIE, generateAccessToken(payload), {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie(REFRESH_TOKEN_COOKIE, generateRefreshToken(payload), {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export async function register(
  email: string,
  password: string,
  name: string,
  role: UserRole = UserRole.CUSTOMER
): Promise<{ user: IUser }> {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('Email already registered');
  }
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash: password,
    name,
    role,
  });
  return { user };
}

export async function login(
  email: string,
  password: string,
  res: import('express').Response
): Promise<{ user: IUser }> {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  const payload: TokenPayload = { userId: user._id.toString(), role: user.role };
  setTokenCookies(res, payload);
  return { user };
}

export async function refresh(
  refreshToken: string,
  res: import('express').Response
): Promise<{ user: IUser }> {
  let payload: TokenPayload;
  try {
    const { verifyRefreshToken } = await import('./token.service');
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User not found or inactive');
  }
  const newPayload: TokenPayload = { userId: user._id.toString(), role: user.role };
  setTokenCookies(res, newPayload);
  return { user };
}

export function logout(res: import('express').Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE);
  res.clearCookie(REFRESH_TOKEN_COOKIE);
}

export async function logAudit(
  actor: string,
  action: string,
  entity: string,
  entityId: string,
  changes?: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  await AuditLog.create({ actor, action, entity, entityId, changes, metadata });
}
