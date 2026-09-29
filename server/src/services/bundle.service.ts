import mongoose from 'mongoose';
import { Bundle, IBundle } from '../models/Bundle';
import { Booking, BookingStatus, IBooking } from '../models/Booking';
import { Equipment } from '../models/Equipment';
import { ApiError } from '../utils/ApiError';
import { checkAvailability } from './booking-engine.service';
import { logger } from '../config/logger';

/**
 * Create a bundle booking — atomically books multiple items with a discount.
 */
export async function createBundleBooking(
  userId: string,
  bundleId: string,
  startDate: Date,
  endDate: Date,
  idempotencyKey: string
): Promise<IBooking[]> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get bundle
    const bundle = await Bundle.findOne({ _id: bundleId, isActive: true, deletedAt: null }).session(session);
    if (!bundle) {
      throw ApiError.notFound('Bundle not found');
    }

    // Check availability for all items
    for (const item of bundle.items) {
      const available = await checkAvailability(item.equipment.toString(), startDate, endDate);
      if (!available) {
        const equipment = await Equipment.findById(item.equipment).session(session);
        throw ApiError.conflict(`${equipment?.name ?? 'Equipment'} is not available for selected dates`);
      }
    }

    // Calculate total with discount
    let totalAmount = 0;
    for (const item of bundle.items) {
      const equipment = await Equipment.findById(item.equipment).session(session);
      if (equipment) {
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        totalAmount += equipment.pricePerDay * days * item.quantity;
      }
    }
    totalAmount = Math.round(totalAmount * (1 - bundle.discountPercent / 100));

    // Create bookings for all items
    const bookings: IBooking[] = [];
    for (let i = 0; i < bundle.items.length; i++) {
      const item = bundle.items[i];
      const equipment = await Equipment.findById(item.equipment).session(session);
      if (equipment) {
        const booking = await Booking.create([{
          equipment: item.equipment,
          customer: userId,
          owner: equipment.owner,
          startDate,
          endDate,
          status: BookingStatus.CONFIRMED,
          totalAmount: Math.round(totalAmount / bundle.items.length),
          depositAmount: equipment.deposit,
          depositHeld: true,
          idempotencyKey: `${idempotencyKey}-${i}`,
        }], { session });
        bookings.push(booking[0]);
      }
    }

    await session.commitTransaction();
    logger.info('Bundle booking created', { bundleId, userId, bookings: bookings.length });
    return bookings;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Get all active bundles.
 */
export async function getBundles(ownerId?: string): Promise<IBundle[]> {
  const filter: Record<string, unknown> = { isActive: true, deletedAt: null };
  if (ownerId) filter.owner = ownerId;
  return Bundle.find(filter).populate('items.equipment', 'name images pricePerDay city');
}

/**
 * Create a new bundle.
 */
export async function createBundle(
  ownerId: string,
  name: string,
  description: string,
  items: Array<{ equipment: string; quantity: number }>,
  discountPercent: number
): Promise<IBundle> {
  // Verify all equipment belongs to owner
  for (const item of items) {
    const equipment = await Equipment.findOne({ _id: item.equipment, owner: ownerId, deletedAt: null });
    if (!equipment) {
      throw ApiError.badRequest(`Equipment ${item.equipment} not found or not owned by you`);
    }
  }

  const bundle = await Bundle.create({
    owner: ownerId,
    name,
    description,
    items,
    discountPercent,
  });

  logger.info('Bundle created', { bundleId: bundle._id, ownerId, name });
  return bundle;
}
