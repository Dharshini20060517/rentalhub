import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '../models/User';
import { calculateHandler, getHandler } from '../controllers/health-score.controller';

const router = Router();

router.post('/equipment/:equipmentId/calculate', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), calculateHandler);
router.get('/equipment/:equipmentId', authenticate, getHandler);

export default router;
