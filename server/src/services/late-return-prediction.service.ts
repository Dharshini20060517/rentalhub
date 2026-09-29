import { Booking, BookingStatus } from '../models/Booking';
import { TrustScore } from '../models/TrustScore';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

export interface LateReturnPrediction {
  bookingId: string;
  riskScore: number; // 0-100, higher = more likely to be late
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    trustScore: number;
    previousLateReturns: number;
    rentalDurationDays: number;
    daysUntilDue: number;
  };
  recommendation: string;
}

/**
 * Predict if a booking is likely to be returned late.
 * Based on trust score, history, and duration.
 */
export async function predictLateReturn(bookingId: string): Promise<LateReturnPrediction> {
  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null });
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  if (booking.status !== BookingStatus.IN_USE && booking.status !== BookingStatus.RETURN_PENDING) {
    throw ApiError.conflict('Can only predict late return for active bookings');
  }

  // ── Trust Score ────────────────────────────────────────
  const trustScoreDoc = await TrustScore.findOne({ user: booking.customer, deletedAt: null });
  const trustScore = trustScoreDoc?.score ?? 50;

  // ── Previous Late Returns ──────────────────────────────
  const previousLateReturns = await Booking.countDocuments({
    customer: booking.customer,
    deletedAt: null,
    status: BookingStatus.LATE,
  });

  // ── Rental Duration ────────────────────────────────────
  const rentalDurationDays = Math.ceil(
    (booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // ── Days Until Due ─────────────────────────────────────
  const daysUntilDue = Math.ceil(
    (booking.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // ── Risk Score ─────────────────────────────────────────
  const trustRisk = Math.max(0, (100 - trustScore) / 100); // 0-1
  const historyRisk = Math.min(previousLateReturns / 5, 1); // 0-1
  const durationRisk = Math.min(rentalDurationDays / 14, 1); // 0-1
  const urgencyRisk = daysUntilDue < 0 ? 1 : daysUntilDue < 1 ? 0.7 : daysUntilDue < 3 ? 0.3 : 0;

  const riskScore = Math.round(
    (trustRisk * 0.35 + historyRisk * 0.25 + durationRisk * 0.2 + urgencyRisk * 0.2) * 100
  );

  const riskLevel: 'low' | 'medium' | 'high' =
    riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

  // ── Recommendation ─────────────────────────────────────
  let recommendation: string;
  if (riskLevel === 'high') {
    recommendation = 'Send reminder 24 hours before due date. Consider calling customer.';
  } else if (riskLevel === 'medium') {
    recommendation = 'Send reminder 48 hours before due date.';
  } else {
    recommendation = 'Standard reminder 72 hours before due date.';
  }

  logger.info('Late return prediction', { bookingId, riskScore, riskLevel });

  return {
    bookingId,
    riskScore,
    riskLevel,
    factors: {
      trustScore,
      previousLateReturns,
      rentalDurationDays,
      daysUntilDue,
    },
    recommendation,
  };
}

/**
 * Get all bookings at risk of late return.
 */
export async function getLateReturnRisks(ownerId?: string): Promise<LateReturnPrediction[]> {
  const filter: Record<string, unknown> = {
    deletedAt: null,
    status: { $in: [BookingStatus.IN_USE, BookingStatus.RETURN_PENDING] },
  };
  if (ownerId) filter.owner = ownerId;

  const bookings = await Booking.find(filter).limit(50);
  const predictions: LateReturnPrediction[] = [];

  for (const booking of bookings) {
    try {
      const prediction = await predictLateReturn(booking._id.toString());
      if (prediction.riskLevel !== 'low') {
        predictions.push(prediction);
      }
    } catch {
      // Skip bookings that can't be predicted
    }
  }

  return predictions.sort((a, b) => b.riskScore - a.riskScore);
}
