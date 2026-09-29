import { Request, Response } from 'express';
import { register, login, refresh, logout } from '../services/auth.service';
import { UserRole } from '../models/User';
import { catchAsync } from '../utils/catchAsync';

export const registerHandler = catchAsync(async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;
  const { user } = await register(email, password, name, role as UserRole);
  res.status(201).json({
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

export const loginHandler = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user } = await login(email, password, res);
  res.json({
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

export const refreshHandler = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
    return;
  }
  const { user } = await refresh(token, res);
  res.json({
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

export const logoutHandler = catchAsync(async (_req: Request, res: Response) => {
  logout(res);
  res.json({ data: { message: 'Logged out successfully' } });
});

export const meHandler = catchAsync(async (req: Request, res: Response) => {
  res.json({
    data: {
      id: req.user!.userId,
      role: req.user!.role,
    },
  });
});
