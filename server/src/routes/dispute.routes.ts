import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '../models/User';
import {
  raiseDisputeHandler,
  getEvidenceHandler,
  getSuggestedResolutionHandler,
  resolveDisputeHandler,
  appealDisputeHandler,
  listDisputesHandler,
  getDisputeHandler,
} from '../controllers/dispute.controller';

const router = Router();

const raiseSchema = z.object({
  bookingId: z.string().min(1),
  reason: z.enum(['DAMAGE', 'LATE_RETURN', 'ITEM_NOT_AS_DESCRIBED', 'PAYMENT_ISSUE', 'OTHER']),
  description: z.string().min(10).max(5000),
  evidence: z.array(z.string()).default([]),
});

const resolveSchema = z.object({
  resolution: z.string().min(10).max(5000),
});

const appealSchema = z.object({
  reason: z.string().min(10).max(2000),
});

const listQuerySchema = z.object({
  status: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

router.post('/', authenticate, validate({ body: raiseSchema }), raiseDisputeHandler);
router.get('/', authenticate, requireRole(UserRole.ADMIN), validate({ query: listQuerySchema }), listDisputesHandler);
router.get('/:id', authenticate, getDisputeHandler);
router.get('/:id/evidence', authenticate, getEvidenceHandler);
router.get('/:id/suggested-resolution', authenticate, getSuggestedResolutionHandler);
router.post('/:id/resolve', authenticate, requireRole(UserRole.ADMIN), validate({ body: resolveSchema }), resolveDisputeHandler);
router.post('/:id/appeal', authenticate, validate({ body: appealSchema }), appealDisputeHandler);

export default router;
