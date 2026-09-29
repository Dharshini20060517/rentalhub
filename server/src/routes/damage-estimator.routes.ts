import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { estimateDamageHandler } from '../controllers/damage-estimator.controller';

const router = Router();

const estimateSchema = z.object({
  equipmentId: z.string().min(1),
  regions: z.array(z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    label: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    confidence: z.number(),
  })),
});

router.post('/estimate', authenticate, validate({ body: estimateSchema }), estimateDamageHandler);

export default router;
