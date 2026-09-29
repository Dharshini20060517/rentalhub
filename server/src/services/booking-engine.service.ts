import mongoose from 'mongoose';
import { Booking, BookingStatus, IBooking } from '../models/Booking';
import { BookingHold } from '../models/BookingHold';
import { Equipment } from '../models/Equipment';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

const HOLD_DURATION_MINUTES = 10;

// ── State Machine ───────────────────────────────────────
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.HELD, BookingStatus.CANCELLED],
  [BookingStatus.HELD]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.PICKED_UP, BookingStatus.CANCELLED],
  [BookingStatus.PICKED_UP]: [BookingStatus.IN_USE],
  [BookingStatus.IN_USE]: [BookingStatus.RETURN_PENDING, BookingStatus.LATE],
  [BookingStatus.RETURN_PENDING]: [BookingStatus.RETURNED, BookingStatus.LATE],
  [BookingStatus.RETURNED]: [BookingStatus.INSPECTED],
  [BookingStatus.INSPECTED]: [BookingStatus.COMPLETED, BookingStatus.DISPUTED],
  [BookingStatus.COMPLETED]: [BookingStatus.DISPUTED],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.LATE]: [BookingStatus.RETURN_PENDING],
  [BookingStatus.DISPUTED]: [BookingStatus.INSPECTED, BookingStatus.COMPLETED],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Availability Check ───────────────────────────────────
export async function checkAvailability(
  equipmentId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const overlapQuery: Record<string, unknown> = {
    equipment: equipmentId,
    status: {
      $in: [
        BookingStatus.CONFIRMED,
        BookingStatus.PICKED_UP,
        BookingStatus.IN_USE,
        BookingStatus.RETURN_PENDING,
      ],
    },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
    deletedAt: null,
  };
  if (excludeBookingId) {
    overlapQuery._id = { $ne: excludeBookingId };
  }
  const overlapping = await Booking.findOne(overlapQuery);
  return !overlapping;
}

// ── Create Hold ──────────────────────────────────────────
export async function createHold(
  equipmentId: string,
  customerId: string,
  startDate: Date,
  endDate: Date,
  idempotencyKey: string
): Promise<IBooking> {
  // Check for existing hold with same idempotency key
  const existingHold = await BookingHold.findOne({ idempotencyKey });
  if (existingHold) {
    // Return existing booking if already confirmed
    const existingBooking = await Booking.findOne({ idempotencyKey });
    if (existingBooking) return existingBooking;
  }

  // Check equipment exists and is active
  const equipment = await Equipment.findOne({ _id: equipmentId, deletedAt: null, isActive: true });
  if (!equipment) {
    throw ApiError.notFound('Equipment not found or unavailable');
  }

  // Validate dates
  if (startDate >= endDate) {
    throw ApiError.badRequest('End date must be after start date');
  }
  if (startDate < new Date()) {
    throw ApiError.badRequest('Start date must be in the future');
  }

  // Check for overlapping holds (soft-lock blocks new holds)
  const overlappingHold = await BookingHold.findOne({
    equipment: equipmentId,
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
    expiresAt: { $gt: new Date() },
  });
  if (overlappingHold) {
    throw ApiError.conflict('Equipment is temporarily held for another customer');
  }

  // Check for overlapping confirmed bookings
  const isAvailable = await checkAvailability(equipmentId, startDate, endDate);
  if (!isAvailable) {
    throw ApiError.conflict('Equipment not available for selected dates');
  }

  // Check buffer time
  const bufferMs = equipment.bufferMinutes * 60 * 1000;
  const bufferedStart = new Date(startDate.getTime() - bufferMs);
  const bufferedEnd = new Date(endDate.getTime() + bufferMs);
  const bufferOverlap = await Booking.findOne({
    equipment: equipmentId,
    status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PICKED_UP, BookingStatus.IN_USE] },
    startDate: { $lt: bufferedEnd },
    endDate: { $gt: bufferedStart },
    deletedAt: null,
  });
  if (bufferOverlap) {
    throw ApiError.conflict('Equipment has buffer time conflict with another booking');
  }

  // Create hold
  const expiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000);
  await BookingHold.create({
    equipment: equipmentId,
    customer: customerId,
    startDate,
    endDate,
    expiresAt,
    idempotencyKey,
  });

  // Create booking in PENDING state
  const totalAmount = calculatePrice(equipment.pricePerDay, equipment.pricePerHour, startDate, endDate);
  const booking = await Booking.create({
    equipment: equipmentId,
    customer: customerId,
    owner: equipment.owner,
    startDate,
    endDate,
    status: BookingStatus.PENDING,
    totalAmount,
    depositAmount: equipment.deposit,
    idempotencyKey,
  });

  logger.info('Booking hold created', { bookingId: booking._id, equipmentId, customerId });
  return booking;
}

// ── Confirm Booking ──────────────────────────────────────
export async function confirmBooking(
  bookingId: string,
  customerId: string,
  paymentId: string
): Promise<IBooking> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Lock the booking document
    const booking = await Booking.findOne({
      _id: bookingId,
      customer: customerId,
      status: BookingStatus.PENDING,
      deletedAt: null,
    }).session(session);

    if (!booking) {
      throw ApiError.notFound('Booking not found or already processed');
    }

    // Check hold still exists (not expired)
    const hold = await BookingHold.findOne({
      equipment: booking.equipment,
      customer: customerId,
      expiresAt: { $gt: new Date() },
    }).session(session);

    if (!hold) {
      // Hold expired — cancel booking
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledAt = new Date();
      booking.cancellationReason = 'Hold expired';
      await booking.save({ session });
      await session.commitTransaction();
      throw ApiError.conflict('Hold has expired. Please try again.');
    }

    // Check for overlapping confirmed bookings (within transaction)
    const overlapping = await Booking.findOne({
      equipment: booking.equipment,
      status: {
        $in: [BookingStatus.CONFIRMED, BookingStatus.PICKED_UP, BookingStatus.IN_USE],
      },
      startDate: { $lt: booking.endDate },
      endDate: { $gt: booking.startDate },
      deletedAt: null,
      _id: { $ne: bookingId },
    }).session(session);

    if (overlapping) {
      throw ApiError.conflict('Equipment was just booked by another customer');
    }

    // Confirm booking
    booking.status = BookingStatus.CONFIRMED;
    booking.depositHeld = true;
    await booking.save({ session });

    // Delete hold
    await BookingHold.deleteOne({ _id: hold._id }).session(session);

    await session.commitTransaction();
    logger.info('Booking confirmed', { bookingId: booking._id, paymentId });
    return booking;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// ── Cancel Booking ───────────────────────────────────────
export async function cancelBooking(
  bookingId: string,
  userId: string,
  reason?: string
): Promise<IBooking> {
  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null });
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Only customer or owner can cancel
  if (booking.customer.toString() !== userId && booking.owner.toString() !== userId) {
    throw ApiError.forbidden('Not authorized to cancel this booking');
  }

  if (!canTransition(booking.status, BookingStatus.CANCELLED)) {
    throw ApiError.conflict(`Cannot cancel booking in status: ${booking.status}`);
  }

  booking.status = BookingStatus.CANCELLED;
  booking.cancelledAt = new Date();
  booking.cancellationReason = reason;
  await booking.save();

  // Release hold if exists
  await BookingHold.deleteOne({ equipment: booking.equipment, customer: booking.customer });

  logger.info('Booking cancelled', { bookingId, userId, reason });
  return booking;
}

// ── Transition Status ────────────────────────────────────
export async function transitionStatus(
  bookingId: string,
  newStatus: BookingStatus,
  userId: string
): Promise<IBooking> {
  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null });
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Only owner or admin can transition (except customer can initiate return)
  const isOwner = booking.owner.toString() === userId;
  const isCustomer = booking.customer.toString() === userId;
  if (!isOwner && !isCustomer) {
    throw ApiError.forbidden('Not authorized to update this booking');
  }

  // Customer can only initiate return
  if (isCustomer && newStatus !== BookingStatus.RETURN_PENDING) {
    throw ApiError.forbidden('Customer can only initiate return');
  }

  if (!canTransition(booking.status, newStatus)) {
    throw ApiError.conflict(`Cannot transition from ${booking.status} to ${newStatus}`);
  }

  booking.status = newStatus;
  await booking.save();

  logger.info('Booking status transitioned', { bookingId, from: booking.status, to: newStatus });
  return booking;
}

// ── Price Calculation ────────────────────────────────────
function calculatePrice(
  pricePerDay: number,
  pricePerHour: number | undefined,
  startDate: Date,
  endDate: Date
): number {
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  const durationDays = Math.ceil(durationHours / 24);

  if (pricePerHour && durationHours < 24) {
    return Math.round(pricePerHour * durationHours);
  }
  return Math.round(pricePerDay * durationDays);
}

// ── Get Bookings ─────────────────────────────────────────
export async function getBookings(
  userId: string,
  role: 'customer' | 'owner',
  status?: BookingStatus,
  page = 1,
  limit = 20
): Promise<{ bookings: IBooking[]; total: number }> {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (role === 'customer') filter.customer = userId;
  else filter.owner = userId;
  if (status) filter.status = status;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('equipment', 'name images pricePerDay city')
      .populate('customer', 'name email')
      .populate('owner', 'name email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Booking.countDocuments(filter),
  ]);

  return { bookings, total };
}

// ── Get Single Booking ───────────────────────────────────
export async function getBooking(bookingId: string, userId: string): Promise<IBooking> {
  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null })
    .populate('equipment', 'name images pricePerDay city deposit')
    .populate('customer', 'name email phone')
    .populate('owner', 'name email phone');

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  if (booking.customer._id.toString() !== userId && booking.owner._id.toString() !== userId) {
    throw ApiError.forbidden('Not authorized to view this booking');
  }

  return booking;
}

// ── Return Flow ──────────────────────────────────────────
export async function initiateReturn(bookingId: string, customerId: string): Promise<IBooking> {
  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null });
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  if (booking.customer.toString() !== customerId) {
    throw ApiError.forbidden('Only the customer can initiate return');
  }
  if (!canTransition(booking.status, BookingStatus.RETURN_PENDING)) {
    throw ApiError.conflict(`Cannot initiate return from status: ${booking.status}`);
  }
  booking.status = BookingStatus.RETURN_PENDING;
  await booking.save();
  logger.info('Return initiated', { bookingId, customerId });
  return booking;
}

export async function confirmReturn(bookingId: string, ownerId: string): Promise<IBooking> {
  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null });
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  if (booking.owner.toString() !== ownerId) {
    throw ApiError.forbidden('Only the owner can confirm return');
  }
  if (!canTransition(booking.status, BookingStatus.RETURNED)) {
    throw ApiError.conflict(`Cannot confirm return from status: ${booking.status}`);
  }
  booking.status = BookingStatus.RETURNED;
  await booking.save();
  logger.info('Return confirmed', { bookingId, ownerId });
  return booking;
}

export async function inspectReturn(
  bookingId: string,
  ownerId: string,
  conditionRating: number,
  notes?: string
): Promise<IBooking> {
  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null });
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  if (booking.owner.toString() !== ownerId) {
    throw ApiError.forbidden('Only the owner can inspect return');
  }
  if (!canTransition(booking.status, BookingStatus.INSPECTED)) {
    throw ApiError.conflict(`Cannot inspect from status: ${booking.status}`);
  }
  booking.status = BookingStatus.INSPECTED;
  booking.notes = notes;
  await booking.save();
  logger.info('Return inspected', { bookingId, ownerId, conditionRating });
  return booking;
}

export async function completeBooking(bookingId: string, ownerId: string): Promise<IBooking> {
  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null });
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  if (booking.owner.toString() !== ownerId) {
    throw ApiError.forbidden('Only the owner can complete booking');
  }
  if (!canTransition(booking.status, BookingStatus.COMPLETED)) {
    throw ApiError.conflict(`Cannot complete from status: ${booking.status}`);
  }
  booking.status = BookingStatus.COMPLETED;
  booking.depositHeld = false;
  await booking.save();
  logger.info('Booking completed', { bookingId, ownerId });
  return booking;
}

export async function markLate(bookingId: string): Promise<IBooking> {
  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null });
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  if (!canTransition(booking.status, BookingStatus.LATE)) {
    throw ApiError.conflict(`Cannot mark late from status: ${booking.status}`);
  }
  booking.status = BookingStatus.LATE;
  await booking.save();
  logger.info('Booking marked late', { bookingId });
  return booking;
}
