import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { analyzeDamageHandler } from '../controllers/ai-vision.controller';

const router = Router();

const analyzeSchema = z.object({
  beforeImageUrl: z.string().url(),
  afterImageUrl: z.string().url(),
  equipmentId: z.string().min(1),
});

router.post('/analyze-damage', authenticate, validate({ body: analyzeSchema }), analyzeDamageHandler);

export default router;
