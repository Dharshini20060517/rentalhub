import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  joinWaitlistHandler,
  listWaitlistHandler,
  cancelWaitlistHandler,
  getWaitlistForEquipmentHandler,
} from '../controllers/waitlist.controller';

const router = Router();

const joinSchema = z.object({
  equipmentId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

router.get('/', authenticate, listWaitlistHandler);
router.post('/', authenticate, validate({ body: joinSchema }), joinWaitlistHandler);
router.delete('/:id', authenticate, cancelWaitlistHandler);
router.get('/equipment/:equipmentId', authenticate, getWaitlistForEquipmentHandler);

export default router;
