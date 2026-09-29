import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  createInspectionHandler,
  getInspectionsHandler,
  getInspectionHandler,
  updateAIAnalysisHandler,
} from '../controllers/inspection.controller';

const router = Router();

const createSchema = z.object({
  bookingId: z.string().min(1),
  type: z.enum(['PICKUP', 'RETURN']),
  photos: z.array(z.object({
    url: z.string(),
    hash: z.string(),
    takenAt: z.string().datetime(),
    angle: z.string().optional(),
  })).default([]),
  checklist: z.array(z.object({
    item: z.string(),
    ok: z.boolean(),
    note: z.string().optional(),
  })).default([]),
  conditionRating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  signature: z.string().optional(),
});

const aiSchema = z.object({
  damageDetected: z.boolean(),
  regions: z.array(z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    label: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    confidence: z.number(),
  })).default([]),
  overallConfidence: z.number(),
  reasoning: z.string(),
});

router.post('/', authenticate, validate({ body: createSchema }), createInspectionHandler);
router.get('/booking/:bookingId', authenticate, getInspectionsHandler);
router.get('/:id', authenticate, getInspectionHandler);
router.patch('/:id/ai-analysis', authenticate, validate({ body: aiSchema }), updateAIAnalysisHandler);

export default router;
