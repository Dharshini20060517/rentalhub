import { Dispute, DisputeStatus, DisputeReason, IDispute } from '../models/Dispute';
import { Booking, BookingStatus } from '../models/Booking';
import { Inspection } from '../models/Inspection';
import { Equipment } from '../models/Equipment';
import { TrustScore } from '../models/TrustScore';
import { HealthScore } from '../models/HealthScore';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

export interface DisputeEvidence {
  booking: Record<string, unknown>;
  equipment: Record<string, unknown>;
  pickupInspection: Record<string, unknown> | null;
  returnInspection: Record<string, unknown> | null;
  trustScores: { customer: number | null; owner: number | null };
  healthScore: number | null;
  timeline: Array<{ event: string; timestamp: string; details: string }>;
}

/**
 * Raise a dispute for a booking.
 */
export async function raiseDispute(
  bookingId: string,
  raisedById: string,
  reason: DisputeReason,
  description: string,
  evidence: string[]
): Promise<IDispute> {
  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null });
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Only customer or owner can raise dispute
  if (booking.customer.toString() !== raisedById && booking.owner.toString() !== raisedById) {
    throw ApiError.forbidden('Not authorized to raise dispute for this booking');
  }

  // Check for existing open dispute
  const existing = await Dispute.findOne({
    booking: bookingId,
    status: { $in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
  });
  if (existing) {
    throw ApiError.conflict('An open dispute already exists for this booking');
  }

  const against = booking.customer.toString() === raisedById ? booking.owner : booking.customer;

  const dispute = await Dispute.create({
    booking: bookingId,
    raisedBy: raisedById,
    against,
    reason,
    description,
    evidence,
    status: DisputeStatus.OPEN,
  });

  // Update booking status
  booking.status = BookingStatus.DISPUTED;
  await booking.save();

  logger.info('Dispute raised', { disputeId: dispute._id, bookingId, raisedById, reason });
  return dispute;
}

/**
 * Assemble evidence timeline for a dispute.
 * Auto-collects photos, inspections, scores, and booking history.
 */
export async function assembleEvidence(disputeId: string): Promise<DisputeEvidence> {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute || dispute.deletedAt) {
    throw ApiError.notFound('Dispute not found');
  }

  const booking = await Booking.findById(dispute.booking).populate('equipment customer owner');
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  const equipment = await Equipment.findById(booking.equipment);
  const inspections = await Inspection.find({ booking: dispute.booking }).sort({ createdAt: 1 });
  const pickupInspection = inspections.find((i) => i.type === 'PICKUP') ?? null;
  const returnInspection = inspections.find((i) => i.type === 'RETURN') ?? null;

  const customerId = (booking.customer as unknown as { _id: string })._id;
  const ownerId = (booking.owner as unknown as { _id: string })._id;
  const equipmentId = (booking.equipment as unknown as { _id: string })._id;

  const [customerTrust, ownerTrust, healthScore] = await Promise.all([
    TrustScore.findOne({ user: customerId, deletedAt: null }),
    TrustScore.findOne({ user: ownerId, deletedAt: null }),
    HealthScore.findOne({ equipment: equipmentId, deletedAt: null }),
  ]);

  // Build timeline
  const timeline: Array<{ event: string; timestamp: string; details: string }> = [
    {
      event: 'Booking created',
      timestamp: booking.createdAt.toISOString(),
      details: `Booking created by ${(booking.customer as unknown as { name: string }).name}`,
    },
  ];

  if (pickupInspection) {
    timeline.push({
      event: 'Pickup inspection',
      timestamp: pickupInspection.createdAt.toISOString(),
      details: `Condition rating: ${pickupInspection.conditionRating}/5`,
    });
  }

  if (returnInspection) {
    timeline.push({
      event: 'Return inspection',
      timestamp: returnInspection.createdAt.toISOString(),
      details: `Condition rating: ${returnInspection.conditionRating}/5`,
    });
  }

  timeline.push({
    event: 'Dispute raised',
    timestamp: dispute.createdAt.toISOString(),
    details: `Reason: ${dispute.reason}`,
  });

  return {
    booking: booking.toObject() as unknown as Record<string, unknown>,
    equipment: (equipment?.toObject() ?? {}) as unknown as Record<string, unknown>,
    pickupInspection: (pickupInspection?.toObject() ?? null) as unknown as Record<string, unknown> | null,
    returnInspection: (returnInspection?.toObject() ?? null) as unknown as Record<string, unknown> | null,
    trustScores: {
      customer: customerTrust?.score ?? null,
      owner: ownerTrust?.score ?? null,
    },
    healthScore: healthScore?.score ?? null,
    timeline,
  };
}

/**
 * Get AI-suggested resolution for a dispute.
 */
export async function suggestResolution(disputeId: string): Promise<{
  suggestedResolution: string;
  confidence: number;
  reasoning: string;
}> {
  const evidence = await assembleEvidence(disputeId);

  const customerTrust = evidence.trustScores.customer ?? 50;
  const ownerTrust = evidence.trustScores.owner ?? 50;
  const returnCondition = (evidence.returnInspection as { conditionRating?: number })?.conditionRating ?? 3;
  const pickupCondition = (evidence.pickupInspection as { conditionRating?: number })?.conditionRating ?? 3;

  let suggestedResolution: string;
  let confidence: number;
  const reasoningParts: string[] = [];

  if (returnCondition < pickupCondition) {
    const damageSeverity = pickupCondition - returnCondition;
    if (damageSeverity >= 2) {
      suggestedResolution = 'Partial refund to customer based on damage severity';
      confidence = 0.7;
      reasoningParts.push(`Return condition (${returnCondition}) significantly worse than pickup (${pickupCondition})`);
    } else {
      suggestedResolution = 'Full refund to customer — minor damage within acceptable range';
      confidence = 0.6;
      reasoningParts.push(`Minor condition difference (${pickupCondition} → ${returnCondition})`);
    }
  } else if (customerTrust < 40) {
    suggestedResolution = 'Review customer history — low trust score may indicate pattern';
    confidence = 0.5;
    reasoningParts.push(`Customer trust score is low (${customerTrust})`);
  } else if (ownerTrust < 40) {
    suggestedResolution = 'Review owner history — low trust score may indicate pattern';
    confidence = 0.5;
    reasoningParts.push(`Owner trust score is low (${ownerTrust})`);
  } else {
    suggestedResolution = 'Mutual resolution recommended — both parties have good standing';
    confidence = 0.6;
    reasoningParts.push('Both parties have good trust scores');
  }

  reasoningParts.push(`Health score: ${evidence.healthScore ?? 'N/A'}`);

  return {
    suggestedResolution,
    confidence,
    reasoning: reasoningParts.join('. '),
  };
}

/**
 * Resolve a dispute.
 */
export async function resolveDispute(
  disputeId: string,
  resolverId: string,
  resolution: string
): Promise<IDispute> {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute || dispute.deletedAt) {
    throw ApiError.notFound('Dispute not found');
  }

  if (dispute.status !== DisputeStatus.OPEN && dispute.status !== DisputeStatus.UNDER_REVIEW) {
    throw ApiError.conflict('Dispute is not open for resolution');
  }

  dispute.status = DisputeStatus.RESOLVED;
  dispute.resolution = resolution;
  dispute.resolvedBy = resolverId as unknown as typeof dispute.resolvedBy;
  dispute.resolvedAt = new Date();
  await dispute.save();

  // Update booking status back to completed
  const booking = await Booking.findById(dispute.booking);
  if (booking) {
    booking.status = BookingStatus.COMPLETED;
    await booking.save();
  }

  logger.info('Dispute resolved', { disputeId, resolverId, resolution });
  return dispute;
}

/**
 * Appeal a resolved dispute.
 */
export async function appealDispute(
  disputeId: string,
  userId: string,
  reason: string
): Promise<IDispute> {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute || dispute.deletedAt) {
    throw ApiError.notFound('Dispute not found');
  }

  if (dispute.status !== DisputeStatus.RESOLVED) {
    throw ApiError.conflict('Can only appeal resolved disputes');
  }

  if (dispute.raisedBy.toString() !== userId && dispute.against.toString() !== userId) {
    throw ApiError.forbidden('Not authorized to appeal this dispute');
  }

  dispute.status = DisputeStatus.APPEALED;
  dispute.resolution = `Appeal: ${reason}`;
  await dispute.save();

  logger.info('Dispute appealed', { disputeId, userId, reason });
  return dispute;
}

/**
 * Get disputes for admin console.
 */
export async function getDisputesForAdmin(
  status?: DisputeStatus,
  page = 1,
  limit = 20
): Promise<{ disputes: IDispute[]; total: number }> {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (status) filter.status = status;

  const [disputes, total] = await Promise.all([
    Dispute.find(filter)
      .populate('raisedBy', 'name email')
      .populate('against', 'name email')
      .populate('booking', 'equipment startDate endDate totalAmount')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Dispute.countDocuments(filter),
  ]);

  return { disputes, total };
}
