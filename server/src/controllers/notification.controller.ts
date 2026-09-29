import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export const listNotificationsHandler = catchAsync(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', unreadOnly } = req.query;
  const filter: Record<string, unknown> = { user: req.user!.userId };
  if (unreadOnly === 'true') filter.read = false;

  const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).skip(skip).limit(parseInt(limit as string, 10)).sort({ createdAt: -1 }),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user!.userId, read: false }),
  ]);

  res.json({
    data: notifications,
    unreadCount,
    pagination: { page: parseInt(page as string, 10), limit: parseInt(limit as string, 10), total },
  });
});

export const markAsReadHandler = catchAsync(async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!.userId },
    { read: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }
  res.json({ data: notification });
});

export const markAllAsReadHandler = catchAsync(async (req: Request, res: Response) => {
  await Notification.updateMany(
    { user: req.user!.userId, read: false },
    { read: true, readAt: new Date() }
  );
  res.json({ data: { message: 'All notifications marked as read' } });
});

export const deleteNotificationHandler = catchAsync(async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user!.userId,
  });
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }
  res.json({ data: { message: 'Notification deleted' } });
});
