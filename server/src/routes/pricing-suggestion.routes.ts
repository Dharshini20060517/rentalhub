import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '../models/User';
import {
  generateSuggestionHandler,
  getLatestSuggestionHandler,
} from '../controllers/pricing-suggestion.controller';

const router = Router();

router.post('/equipment/:equipmentId/generate', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), generateSuggestionHandler);
router.get('/equipment/:equipmentId/latest', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), getLatestSuggestionHandler);

export default router;
