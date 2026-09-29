import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  recommendationsHandler,
  frequentlyRentedTogetherHandler,
  similarAvailableHandler,
} from '../controllers/recommendation.controller';

const router = Router();

router.get('/', authenticate, recommendationsHandler);
router.get('/equipment/:equipmentId/frequently-together', authenticate, frequentlyRentedTogetherHandler);
router.get('/equipment/:equipmentId/similar', authenticate, similarAvailableHandler);

export default router;
