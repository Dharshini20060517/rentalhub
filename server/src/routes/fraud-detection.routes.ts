import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '../models/User';
import { detectHandler, listFlagsHandler, reviewFlagHandler } from '../controllers/fraud-detection.controller';

const router = Router();

const reviewSchema = z.object({
  status: z.enum(['OPEN', 'REVIEWED', 'DISMISSED']),
});

router.post('/detect/:userId', authenticate, requireRole(UserRole.ADMIN), detectHandler);
router.get('/', authenticate, requireRole(UserRole.ADMIN), listFlagsHandler);
router.patch('/:id/review', authenticate, requireRole(UserRole.ADMIN), validate({ body: reviewSchema }), reviewFlagHandler);

export default router;
