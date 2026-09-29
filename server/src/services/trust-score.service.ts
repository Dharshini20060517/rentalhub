import { Booking, BookingStatus } from '../models/Booking';
import { Dispute, DisputeStatus } from '../models/Dispute';
import { Review } from '../models/Review';
import { User, VerificationLevel } from '../models/User';
import { TrustScore } from '../models/TrustScore';
import { logger } from '../config/logger';

export interface TrustFactors {
  onTimeReturns: number;
  damageHistory: number;
  disputeOutcomes: number;
  cancellationRate: number;
  verificationLevel: number;
  reviewQuality: number;
}

/**
 * Calculate and store trust score for a user (0-100).
 */
export async function calculateTrustScore(userId: string): Promise<number> {
  const user = await User.findById(userId);
  if (!user || user.deletedAt) {
    throw new Error('User not found');
  }

  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  // ── On-Time Returns ────────────────────────────────────
  const completedBookings = await Booking.find({
    customer: userId,
    deletedAt: null,
    status: { $in: [BookingStatus.COMPLETED, BookingStatus.INSPECTED, BookingStatus.RETURNED] },
    endDate: { $gte: sixMonthsAgo },
  });

  const onTimeReturns = completedBookings.filter((b) => b.endDate <= b.updatedAt).length;
  const totalReturns = completedBookings.length;
  const onTimeScore = totalReturns > 0 ? (onTimeReturns / totalReturns) * 100 : 80;

  // ── Damage History ─────────────────────────────────────
  const damageDisputes = await Dispute.countDocuments({
    raisedBy: userId,
    deletedAt: null,
    reason: 'DAMAGE',
    status: DisputeStatus.RESOLVED,
  });
  const damageScore = Math.max(0, 100 - damageDisputes * 25);

  // ── Dispute Outcomes ───────────────────────────────────
  const totalDisputes = await Dispute.countDocuments({
    $or: [{ raisedBy: userId }, { against: userId }],
    deletedAt: null,
  });
  const lostDisputes = await Dispute.countDocuments({
    $or: [{ raisedBy: userId }, { against: userId }],
    deletedAt: null,
    status: DisputeStatus.RESOLVED,
    resolvedBy: { $ne: userId },
  });
  const disputeScore = totalDisputes > 0 ? ((totalDisputes - lostDisputes) / totalDisputes) * 100 : 100;

  // ── Cancellation Rate ───────────────────────────────────
  const totalBookings = await Booking.countDocuments({ customer: userId, deletedAt: null });
  const cancelledBookings = await Booking.countDocuments({
    customer: userId,
    deletedAt: null,
    status: BookingStatus.CANCELLED,
  });
  const cancellationScore = totalBookings > 0 ? (1 - cancelledBookings / totalBookings) * 100 : 100;

  // ── Verification Level ─────────────────────────────────
  const verificationScores: Record<VerificationLevel, number> = {
    [VerificationLevel.NONE]: 0,
    [VerificationLevel.EMAIL]: 25,
    [VerificationLevel.PHONE]: 50,
    [VerificationLevel.ID]: 75,
    [VerificationLevel.FULL]: 100,
  };
  const verificationScore = verificationScores[user.verificationLevel] ?? 0;

  // ── Review Quality ─────────────────────────────────────
  const reviews = await Review.find({ reviewee: userId, deletedAt: null });
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 4;
  const reviewScore = (avgRating / 5) * 100;

  // ── Weighted Score ─────────────────────────────────────
  const weights = {
    onTime: 0.25,
    damage: 0.2,
    dispute: 0.15,
    cancellation: 0.15,
    verification: 0.15,
    review: 0.1,
  };

  const score = Math.round(
    onTimeScore * weights.onTime +
    damageScore * weights.damage +
    disputeScore * weights.dispute +
    cancellationScore * weights.cancellation +
    verificationScore * weights.verification +
    reviewScore * weights.review
  );

  const factors: TrustFactors = {
    onTimeReturns: Math.round(onTimeScore),
    damageHistory: Math.round(damageScore),
    disputeOutcomes: Math.round(disputeScore),
    cancellationRate: Math.round(cancellationScore),
    verificationLevel: Math.round(verificationScore),
    reviewQuality: Math.round(reviewScore),
  };

  // Store trust score
  await TrustScore.findOneAndUpdate(
    { user: userId },
    { score, factors, calculatedAt: now, deletedAt: null },
    { upsert: true, new: true }
  );

  logger.info('Trust score calculated', { userId, score });
  return score;
}

/**
 * Get current trust score for a user.
 */
export async function getTrustScore(userId: string): Promise<{ score: number; factors: TrustFactors } | null> {
  const trustScore = await TrustScore.findOne({ user: userId, deletedAt: null });
  if (!trustScore) return null;
  return { score: trustScore.score, factors: trustScore.factors as TrustFactors };
}

/**
 * Get deposit multiplier based on trust score.
 * High-trust users get reduced or waived deposits.
 */
export function getDepositMultiplier(trustScore: number): number {
  if (trustScore >= 90) return 0.5; // 50% deposit
  if (trustScore >= 75) return 0.75; // 75% deposit
  if (trustScore >= 50) return 1.0; // Full deposit
  if (trustScore >= 25) return 1.5; // 150% deposit
  return 2.0; // 200% deposit
}

/**
 * Check if a booking should be auto-approved based on trust score.
 */
export function shouldAutoApprove(trustScore: number): boolean {
  return trustScore >= 75;
}
