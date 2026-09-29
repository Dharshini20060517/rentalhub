import { Request, Response } from 'express';
import { User } from '../models/User';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export const listUsersHandler = catchAsync(async (req: Request, res: Response) => {
  const { role, page = '1', limit = '20' } = req.query;
  const filter: Record<string, unknown> = { deletedAt: null };
  if (role) filter.role = role;
  const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
  const [users, total] = await Promise.all([
    User.find(filter).select('-passwordHash').skip(skip).limit(parseInt(limit as string, 10)).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);
  res.json({
    data: users,
    pagination: { page: parseInt(page as string, 10), limit: parseInt(limit as string, 10), total },
  });
});

export const getUserHandler = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('-passwordHash');
  if (!user || user.deletedAt) {
    throw ApiError.notFound('User not found');
  }
  res.json({ data: user });
});

export const updateUserHandler = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-passwordHash');
  if (!user || user.deletedAt) {
    throw ApiError.notFound('User not found');
  }
  res.json({ data: user });
});

export const deleteUserHandler = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { deletedAt: new Date(), isActive: false }, { new: true });
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  res.json({ data: { message: 'User deleted' } });
});
