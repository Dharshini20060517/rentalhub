import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from '../controllers/auth.controller';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  role: z.enum(['customer', 'owner', 'admin']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', authLimiter, validate({ body: registerSchema }), registerHandler);
router.post('/login', authLimiter, validate({ body: loginSchema }), loginHandler);
router.post('/refresh', authLimiter, refreshHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);

export default router;
