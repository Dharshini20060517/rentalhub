import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  addToWishlistHandler,
  removeFromWishlistHandler,
  listWishlistHandler,
} from '../controllers/wishlist.controller';

const router = Router();

const addSchema = z.object({
  equipmentId: z.string().min(1),
});

router.get('/', authenticate, listWishlistHandler);
router.post('/', authenticate, validate({ body: addSchema }), addToWishlistHandler);
router.delete('/:equipmentId', authenticate, removeFromWishlistHandler);

export default router;
