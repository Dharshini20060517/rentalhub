import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { nlSearchHandler } from '../controllers/nl-search.controller';

const router = Router();

router.get('/', authenticate, nlSearchHandler);

export default router;
