import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '../models/User';
import { simulatePriceHandler, simulateAvailabilityHandler } from '../controllers/what-if-simulator.controller';

const router = Router();

const priceSchema = z.object({
  newPricePerDay: z.number().positive(),
});

const availabilitySchema = z.object({
  blockedDates: z.array(z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  })),
});

router.post('/equipment/:equipmentId/price', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), validate({ body: priceSchema }), simulatePriceHandler);
router.post('/equipment/:equipmentId/availability', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), validate({ body: availabilitySchema }), simulateAvailabilityHandler);

export default router;
