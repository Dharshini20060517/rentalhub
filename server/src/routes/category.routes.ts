import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '../models/User';
import {
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from '../controllers/category.controller';

const router = Router();

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  parent: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.get('/', listCategoriesHandler);
router.post('/', authenticate, requireRole(UserRole.ADMIN), validate({ body: createSchema }), createCategoryHandler);
router.patch('/:id', authenticate, requireRole(UserRole.ADMIN), validate({ body: updateSchema }), updateCategoryHandler);
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), deleteCategoryHandler);

export default router;
