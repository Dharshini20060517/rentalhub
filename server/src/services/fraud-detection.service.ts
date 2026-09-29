import { Booking, BookingStatus } from '../models/Booking';
import { User } from '../models/User';
import { FraudFlag, FraudFlagType, FraudFlagStatus, IFraudFlag } from '../models/FraudFlag';
import { logger } from '../config/logger';

/**
 * Detect fraud flags for a user based on rule-based patterns.
 */
export async function detectFraudFlags(userId: string): Promise<IFraudFlag[]> {
  const flags: IFraudFlag[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ── Rapid Multi-Account Bookings ───────────────────────
  // Check if user has created multiple accounts and booked the same equipment
  const recentBookings = await Booking.find({
    customer: userId,
    deletedAt: null,
    createdAt: { $gte: oneWeekAgo },
  }).populate('equipment', 'name');

  const equipmentCounts = new Map<string, number>();
  for (const booking of recentBookings) {
    const eqId = (booking.equipment as unknown as { _id: string })._id.toString();
    equipmentCounts.set(eqId, (equipmentCounts.get(eqId) ?? 0) + 1);
  }

  for (const [eqId, count] of equipmentCounts) {
    if (count >= 3) {
      const equipment = recentBookings.find(
        (b) => (b.equipment as unknown as { _id: string })._id.toString() === eqId
      )?.equipment as unknown as { name: string } | undefined;

      flags.push(await FraudFlag.create({
        user: userId,
        type: FraudFlagType.RAPID_MULTI_ACCOUNT,
        severity: 'high',
        description: `Booked same equipment ${count} times in one week`,
        evidence: { equipmentId: eqId, equipmentName: equipment?.name, count },
      }));
    }
  }

  // ── Unusual Cancellation Patterns ──────────────────────
  // Check if user cancels bookings shortly after creating them
  const cancelledBookings = await Booking.find({
    customer: userId,
    deletedAt: null,
    status: BookingStatus.CANCELLED,
    createdAt: { $gte: oneWeekAgo },
  });

  let shortNoticeCancellations = 0;
  for (const booking of cancelledBookings) {
    const timeToCancel = booking.cancelledAt
      ? (booking.cancelledAt.getTime() - booking.createdAt.getTime()) / (1000 * 60 * 60)
      : Infinity;
    if (timeToCancel < 1) {
      shortNoticeCancellations++;
    }
  }

  if (shortNoticeCancellations >= 2) {
    flags.push(await FraudFlag.create({
      user: userId,
      type: FraudFlagType.UNUSUAL_CANCELLATION,
      severity: 'medium',
      description: `Cancelled ${shortNoticeCancellations} bookings within 1 hour of creation`,
      evidence: { shortNoticeCancellations },
    }));
  }

  // ── Suspicious Booking Pattern ─────────────────────────
  // Check if user books equipment but never picks up
  const noShowBookings = await Booking.find({
    customer: userId,
    deletedAt: null,
    status: BookingStatus.CONFIRMED,
    startDate: { $lt: oneDayAgo },
  });

  if (noShowBookings.length >= 3) {
    flags.push(await FraudFlag.create({
      user: userId,
      type: FraudFlagType.SUSPICIOUS_BOOKING_PATTERN,
      severity: 'medium',
      description: `${noShowBookings.length} confirmed bookings passed pickup date without pickup`,
      evidence: { noShowCount: noShowBookings.length },
    }));
  }

  if (flags.length > 0) {
    logger.warn('Fraud flags detected', { userId, flags: flags.length });
  }

  return flags;
}

/**
 * Get all open fraud flags for admin review.
 */
export async function getFraudFlags(status?: FraudFlagStatus, severity?: string): Promise<IFraudFlag[]> {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (severity) filter.severity = severity;

  return FraudFlag.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(50);
}

/**
 * Review a fraud flag.
 */
export async function reviewFraudFlag(
  flagId: string,
  reviewerId: string,
  status: FraudFlagStatus
): Promise<IFraudFlag> {
  const flag = await FraudFlag.findByIdAndUpdate(
    flagId,
    { status, reviewedBy: reviewerId },
    { new: true }
  );
  if (!flag) {
    throw new Error('Fraud flag not found');
  }
  logger.info('Fraud flag reviewed', { flagId, reviewerId, status });
  return flag;
}
