import { Equipment } from '../models/Equipment';
import { Booking, BookingStatus } from '../models/Booking';
import { logger } from '../config/logger';

export interface SimulationResult {
  currentRevenue: number;
  projectedRevenue: number;
  currentUtilization: number;
  projectedUtilization: number;
  changePercent: number;
  reasoning: string;
}

/**
 * Simulate the effect of a price change on revenue and utilization.
 */
export async function simulatePriceChange(
  equipmentId: string,
  newPricePerDay: number
): Promise<SimulationResult> {
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment || equipment.deletedAt) {
    throw new Error('Equipment not found');
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get historical booking data
  const historicalBookings = await Booking.find({
    equipment: equipmentId,
    deletedAt: null,
    status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.INSPECTED] },
    startDate: { $gte: thirtyDaysAgo },
  });

  const currentRevenue = historicalBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const currentBookedDays = historicalBookings.reduce((sum, b) => {
    const days = Math.ceil((b.endDate.getTime() - b.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0);
  const currentUtilization = Math.min(Math.round((currentBookedDays / 30) * 100), 100);

  // Demand elasticity: -1.5 (10% price increase = 15% demand decrease)
  const elasticity = -1.5;
  const priceChangePercent = (newPricePerDay - equipment.pricePerDay) / equipment.pricePerDay;
  const demandChangePercent = elasticity * priceChangePercent;

  // Project new demand
  const projectedBookedDays = Math.max(0, Math.round(currentBookedDays * (1 + demandChangePercent)));
  const projectedRevenue = Math.round(projectedBookedDays * newPricePerDay);
  const projectedUtilization = Math.min(Math.round((projectedBookedDays / 30) * 100), 100);

  const changePercent = currentRevenue > 0
    ? Math.round(((projectedRevenue - currentRevenue) / currentRevenue) * 100)
    : 0;

  const reasoning = `Price change: ${priceChangePercent >= 0 ? '+' : ''}${Math.round(priceChangePercent * 100)}%. ` +
    `Expected demand change: ${Math.round(demandChangePercent * 100)}%. ` +
    `Projected revenue change: ${changePercent >= 0 ? '+' : ''}${changePercent}%.`;

  logger.info('Price simulation complete', { equipmentId, newPricePerDay, projectedRevenue });

  return {
    currentRevenue,
    projectedRevenue,
    currentUtilization,
    projectedUtilization,
    changePercent,
    reasoning,
  };
}

/**
 * Simulate the effect of blocking dates on revenue.
 */
export async function simulateAvailabilityChange(
  equipmentId: string,
  blockedDates: Array<{ start: Date; end: Date }>
): Promise<SimulationResult> {
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment || equipment.deletedAt) {
    throw new Error('Equipment not found');
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get historical booking data
  const historicalBookings = await Booking.find({
    equipment: equipmentId,
    deletedAt: null,
    status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.INSPECTED] },
    startDate: { $gte: thirtyDaysAgo },
  });

  const currentRevenue = historicalBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const currentBookedDays = historicalBookings.reduce((sum, b) => {
    const days = Math.ceil((b.endDate.getTime() - b.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0);
  const currentUtilization = Math.min(Math.round((currentBookedDays / 30) * 100), 100);

  // Calculate blocked days
  const blockedDays = blockedDates.reduce((sum, d) => {
    return sum + Math.ceil((d.end.getTime() - d.start.getTime()) / (1000 * 60 * 60 * 24));
  }, 0);

  // Project new availability
  const projectedBookedDays = Math.max(0, currentBookedDays - blockedDays);
  const projectedRevenue = Math.round(projectedBookedDays * equipment.pricePerDay);
  const projectedUtilization = Math.min(Math.round((projectedBookedDays / 30) * 100), 100);

  const changePercent = currentRevenue > 0
    ? Math.round(((projectedRevenue - currentRevenue) / currentRevenue) * 100)
    : 0;

  const reasoning = `Blocking ${blockedDays} days. ` +
    `Projected revenue change: ${changePercent >= 0 ? '+' : ''}${changePercent}%. ` +
    `Utilization: ${currentUtilization}% → ${projectedUtilization}%.`;

  logger.info('Availability simulation complete', { equipmentId, blockedDays, projectedRevenue });

  return {
    currentRevenue,
    projectedRevenue,
    currentUtilization,
    projectedUtilization,
    changePercent,
    reasoning,
  };
}
