import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  listNotificationsHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  deleteNotificationHandler,
} from '../controllers/notification.controller';

const router = Router();

const listQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  unreadOnly: z.string().optional(),
});

router.get('/', authenticate, validate({ query: listQuerySchema }), listNotificationsHandler);
router.post('/mark-all-read', authenticate, markAllAsReadHandler);
router.patch('/:id/read', authenticate, markAsReadHandler);
router.delete('/:id', authenticate, deleteNotificationHandler);

export default router;
