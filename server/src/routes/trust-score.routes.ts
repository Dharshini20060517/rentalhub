import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  calculateHandler,
  getHandler,
  depositMultiplierHandler,
} from '../controllers/trust-score.controller';

const router = Router();

router.post('/user/:userId/calculate', authenticate, calculateHandler);
router.get('/user/:userId', authenticate, getHandler);
router.get('/deposit-multiplier', authenticate, depositMultiplierHandler);

export default router;
