import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  createBookingHandler,
  initiatePaymentHandler,
  confirmBookingHandler,
  cancelBookingHandler,
  transitionBookingHandler,
  listBookingsHandler,
  getBookingHandler,
} from '../controllers/booking.controller';

const router = Router();

const createSchema = z.object({
  equipmentId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  idempotencyKey: z.string().min(1).max(100),
});

const paymentSchema = z.object({
  bookingId: z.string().min(1),
});

const confirmSchema = z.object({
  bookingId: z.string().min(1),
  paymentId: z.string().min(1),
});

const transitionSchema = z.object({
  status: z.enum([
    'PENDING', 'HELD', 'CONFIRMED', 'PICKED_UP', 'IN_USE',
    'RETURN_PENDING', 'RETURNED', 'INSPECTED', 'COMPLETED',
    'CANCELLED', 'LATE', 'DISPUTED',
  ]),
});

const listQuerySchema = z.object({
  status: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

router.post('/', authenticate, validate({ body: createSchema }), createBookingHandler);
router.post('/payment', authenticate, validate({ body: paymentSchema }), initiatePaymentHandler);
router.post('/confirm', authenticate, validate({ body: confirmSchema }), confirmBookingHandler);
router.get('/', authenticate, validate({ query: listQuerySchema }), listBookingsHandler);
router.get('/:id', authenticate, getBookingHandler);
router.post('/:id/cancel', authenticate, cancelBookingHandler);
router.post('/:id/transition', authenticate, validate({ body: transitionSchema }), transitionBookingHandler);

export default router;
