import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '../models/User';
import { predictHandler, lateReturnRisksHandler } from '../controllers/late-return-prediction.controller';

const router = Router();

router.get('/booking/:bookingId', authenticate, predictHandler);
router.get('/risks', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), lateReturnRisksHandler);

export default router;
