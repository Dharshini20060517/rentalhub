import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '../models/User';
import {
  createBundleBookingHandler,
  listBundlesHandler,
  createBundleHandler,
} from '../controllers/bundle.controller';

const router = Router();

const bookingSchema = z.object({
  bundleId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  idempotencyKey: z.string().min(1).max(100),
});

const createSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(2000),
  items: z.array(z.object({
    equipment: z.string().min(1),
    quantity: z.number().min(1),
  })).min(2),
  discountPercent: z.number().min(1).max(50),
});

router.get('/', authenticate, listBundlesHandler);
router.post('/', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), validate({ body: createSchema }), createBundleHandler);
router.post('/book', authenticate, validate({ body: bookingSchema }), createBundleBookingHandler);

export default router;
