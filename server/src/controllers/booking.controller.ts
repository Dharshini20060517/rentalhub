import { Request, Response } from 'express';
import {
  createHold,
  confirmBooking,
  cancelBooking,
  transitionStatus,
  getBookings,
  getBooking,
} from '../services/booking-engine.service';
import { createDepositPayment } from '../services/payment.service';
import { BookingStatus } from '../models/Booking';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export const createBookingHandler = catchAsync(async (req: Request, res: Response) => {
  const { equipmentId, startDate, endDate, idempotencyKey } = req.body;
  const booking = await createHold(
    equipmentId,
    req.user!.userId,
    new Date(startDate),
    new Date(endDate),
    idempotencyKey
  );
  res.status(201).json({ data: booking });
});

export const initiatePaymentHandler = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.body;
  const booking = await getBooking(bookingId, req.user!.userId);

  if (booking.status !== BookingStatus.PENDING) {
    throw ApiError.conflict('Booking is not in pending state');
  }

  const payment = await createDepositPayment(
    booking.depositAmount,
    'inr',
    req.user!.userId,
    { bookingId: booking._id.toString() }
  );

  res.json({ data: payment });
});

export const confirmBookingHandler = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, paymentId } = req.body;
  const booking = await confirmBooking(bookingId, req.user!.userId, paymentId);
  res.json({ data: booking });
});

export const cancelBookingHandler = catchAsync(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const booking = await cancelBooking(req.params.id, req.user!.userId, reason);
  res.json({ data: booking });
});

export const transitionBookingHandler = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.body;
  const booking = await transitionStatus(req.params.id, status as BookingStatus, req.user!.userId);
  res.json({ data: booking });
});

export const listBookingsHandler = catchAsync(async (req: Request, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query;
  const role = req.user!.role === 'owner' || req.user!.role === 'admin' ? 'owner' : 'customer';
  const { bookings, total } = await getBookings(
    req.user!.userId,
    role,
    status as BookingStatus | undefined,
    parseInt(page as string, 10),
    parseInt(limit as string, 10)
  );
  res.json({
    data: bookings,
    pagination: { page: parseInt(page as string, 10), limit: parseInt(limit as string, 10), total },
  });
});

export const getBookingHandler = catchAsync(async (req: Request, res: Response) => {
  const booking = await getBooking(req.params.id, req.user!.userId);
  res.json({ data: booking });
});
