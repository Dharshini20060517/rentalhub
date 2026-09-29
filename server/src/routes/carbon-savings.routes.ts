import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { calculateHandler } from '../controllers/carbon-savings.controller';

const router = Router();

router.get('/booking/:bookingId', authenticate, calculateHandler);

export default router;
