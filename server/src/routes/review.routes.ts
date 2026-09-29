import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  createReviewHandler,
  listReviewsHandler,
  getReviewHandler,
  deleteReviewHandler,
} from '../controllers/review.controller';

const router = Router();

const createSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
  conditionRating: z.number().min(1).max(5).optional(),
});

const listQuerySchema = z.object({
  equipmentId: z.string().optional(),
  ownerId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

router.get('/', authenticate, validate({ query: listQuerySchema }), listReviewsHandler);
router.post('/', authenticate, validate({ body: createSchema }), createReviewHandler);
router.get('/:id', authenticate, getReviewHandler);
router.delete('/:id', authenticate, deleteReviewHandler);

export default router;
