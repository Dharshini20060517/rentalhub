import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '../models/User';
import {
  listUsersHandler,
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from '../controllers/user.controller';

const router = Router();

const listQuerySchema = z.object({
  role: z.enum(['customer', 'owner', 'admin']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  preferredLanguage: z.enum(['en', 'ta']).optional(),
  city: z.string().optional(),
});

router.get('/', authenticate, requireRole(UserRole.ADMIN), validate({ query: listQuerySchema }), listUsersHandler);
router.get('/:id', authenticate, getUserHandler);
router.patch('/:id', authenticate, validate({ body: updateSchema }), updateUserHandler);
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), deleteUserHandler);

export default router;
