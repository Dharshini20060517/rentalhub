import { Equipment } from '../models/Equipment';
import { Booking, BookingStatus } from '../models/Booking';
import { PricingSuggestion } from '../models/PricingSuggestion';
import { logger } from '../config/logger';

export interface PricingFactors {
  historicalDemand: number;
  seasonality: number;
  dayOfWeek: number;
  leadTime: number;
  utilization: number;
  localEvents: number;
  competitorBand: number;
}

export interface PricingSuggestionResult {
  suggestedPrice: number;
  confidence: number;
  reasoning: string;
  factors: PricingFactors;
}

/**
 * Generate a demand-aware pricing suggestion for equipment.
 * Rule-based approach — AI enhancement comes in Phase 7.
 */
export async function generatePricingSuggestion(equipmentId: string): Promise<PricingSuggestionResult> {
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment || equipment.deletedAt) {
    throw new Error('Equipment not found');
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // ── Historical Demand ─────────────────────────────────
  const recentBookings = await Booking.countDocuments({
    equipment: equipmentId,
    deletedAt: null,
    status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.INSPECTED] },
    startDate: { $gte: thirtyDaysAgo },
  });
  const demandScore = Math.min(recentBookings / 10, 1); // Normalize to 0-1

  // ── Seasonality ────────────────────────────────────────
  const currentMonth = now.getMonth();
  const seasonalBookings = await Booking.aggregate([
    {
      $match: {
        equipment: equipmentId,
        deletedAt: null,
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.INSPECTED] },
        startDate: { $gte: ninetyDaysAgo },
      },
    },
    { $group: { _id: { $month: '$startDate' }, count: { $sum: 1 } } },
  ]);
  const monthCounts = new Array(12).fill(0);
  seasonalBookings.forEach((r) => { monthCounts[r._id - 1] = r.count; });
  const avgMonthly = monthCounts.reduce((a, b) => a + b, 0) / 12;
  const currentMonthCount = monthCounts[currentMonth] || 0;
  const seasonalityScore = avgMonthly > 0 ? currentMonthCount / avgMonthly : 1;

  // ── Day of Week ────────────────────────────────────────
  const dayOfWeekBookings = await Booking.aggregate([
    {
      $match: {
        equipment: equipmentId,
        deletedAt: null,
        startDate: { $gte: ninetyDaysAgo },
      },
    },
    { $group: { _id: { $dayOfWeek: '$startDate' }, count: { $sum: 1 } } },
  ]);
  const dayCounts = new Array(7).fill(0);
  dayOfWeekBookings.forEach((r) => { dayCounts[r._id - 1] = r.count; });
  const avgDaily = dayCounts.reduce((a, b) => a + b, 0) / 7;
  const todayCount = dayCounts[now.getDay()] || 0;
  const dayOfWeekScore = avgDaily > 0 ? todayCount / avgDaily : 1;

  // ── Lead Time ──────────────────────────────────────────
  const leadTimeData = await Booking.aggregate([
    {
      $match: {
        equipment: equipmentId,
        deletedAt: null,
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.INSPECTED] },
      },
    },
    {
      $group: {
        _id: null,
        avgLeadTime: { $avg: { $subtract: ['$startDate', '$createdAt'] } },
      },
    },
  ]);
  const avgLeadTimeDays = leadTimeData[0]?.avgLeadTime
    ? leadTimeData[0].avgLeadTime / (1000 * 60 * 60 * 24)
    : 7;
  const leadTimeScore = Math.min(avgLeadTimeDays / 14, 1);

  // ── Utilization ────────────────────────────────────────
  const bookedDaysResult = await Booking.aggregate([
    {
      $match: {
        equipment: equipmentId,
        deletedAt: null,
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.INSPECTED] },
        startDate: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: null,
        bookedDays: {
          $sum: {
            $ceil: { $divide: [{ $subtract: ['$endDate', '$startDate'] }, 1000 * 60 * 60 * 24] },
          },
        },
      },
    },
  ]);
  const bookedDays = bookedDaysResult[0]?.bookedDays ?? 0;
  const utilizationScore = Math.min(bookedDays / 30, 1);

  // ── Local Events (configurable placeholder) ────────────
  const localEventsScore = 1.0; // Default: no events

  // ── Competitor Band (configurable placeholder) ─────────
  const competitorBandScore = 1.0; // Default: no competitor data

  // ── Calculate Suggested Price ──────────────────────────
  const factors: PricingFactors = {
    historicalDemand: demandScore,
    seasonality: seasonalityScore,
    dayOfWeek: dayOfWeekScore,
    leadTime: leadTimeScore,
    utilization: utilizationScore,
    localEvents: localEventsScore,
    competitorBand: competitorBandScore,
  };

  // Weighted adjustment
  const weights = {
    demand: 0.25,
    seasonality: 0.2,
    dayOfWeek: 0.1,
    leadTime: 0.1,
    utilization: 0.2,
    localEvents: 0.1,
    competitor: 0.05,
  };

  const adjustment =
    (demandScore - 0.5) * weights.demand +
    (seasonalityScore - 1) * weights.seasonality +
    (dayOfWeekScore - 1) * weights.dayOfWeek +
    (leadTimeScore - 0.5) * weights.leadTime +
    (utilizationScore - 0.5) * weights.utilization +
    (localEventsScore - 1) * weights.localEvents +
    (competitorBandScore - 1) * weights.competitor;

  const suggestedPrice = Math.round(equipment.pricePerDay * (1 + adjustment));

  // ── Confidence ─────────────────────────────────────────
  const dataPoints = recentBookings + seasonalBookings.length;
  const confidence = Math.min(0.3 + dataPoints * 0.05, 0.95);

  // ── Reasoning ──────────────────────────────────────────
  const reasons: string[] = [];
  if (demandScore > 0.7) reasons.push('High recent demand');
  if (demandScore < 0.3) reasons.push('Low recent demand');
  if (seasonalityScore > 1.2) reasons.push('Peak season');
  if (seasonalityScore < 0.8) reasons.push('Off-season');
  if (utilizationScore > 0.7) reasons.push('High utilization');
  if (utilizationScore < 0.3) reasons.push('Low utilization');
  if (reasons.length === 0) reasons.push('Stable demand pattern');

  const reasoning = `Suggested ₹${suggestedPrice}/day (${adjustment >= 0 ? '+' : ''}${Math.round(adjustment * 100)}%). ${reasons.join(', ')}.`;

  // Store suggestion
  await PricingSuggestion.create({
    equipment: equipmentId,
    suggestedPrice,
    confidence,
    reasoning,
    factors,
    validFrom: now,
    validUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  });

  logger.info('Pricing suggestion generated', { equipmentId, suggestedPrice, confidence });

  return { suggestedPrice, confidence, reasoning, factors };
}

/**
 * Get the latest pricing suggestion for equipment.
 */
export async function getLatestPricingSuggestion(equipmentId: string): Promise<PricingSuggestionResult | null> {
  const suggestion = await PricingSuggestion.findOne({
    equipment: equipmentId,
    deletedAt: null,
  }).sort({ createdAt: -1 });

  if (!suggestion) return null;

  return {
    suggestedPrice: suggestion.suggestedPrice,
    confidence: suggestion.confidence,
    reasoning: suggestion.reasoning,
    factors: suggestion.factors as PricingFactors,
  };
}
