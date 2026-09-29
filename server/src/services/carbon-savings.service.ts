import { Booking, BookingStatus } from '../models/Booking';
import { Equipment } from '../models/Equipment';
import { logger } from '../config/logger';

export interface CarbonSavings {
  moneySaved: number;
  co2AvoidedKg: number;
  currency: string;
  reasoning: string;
}

// Configurable formula constants
const CO2_PER_RUPEE = 0.0005; // kg CO2 per rupee spent on rental vs buying
const AVG_EQUIPMENT_LIFESPAN_DAYS = 365; // Average equipment lifespan
const RENTAL_VS_BUY_RATIO = 0.1; // Renting costs 10% of buying

/**
 * Calculate carbon and savings badge for a rental.
 * Shows "You saved ₹X and avoided Y kg CO₂ vs buying new".
 */
export async function calculateCarbonSavings(bookingId: string): Promise<CarbonSavings> {
  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null });
  if (!booking) {
    throw new Error('Booking not found');
  }

  const equipment = await Equipment.findById(booking.equipment);
  if (!equipment) {
    throw new Error('Equipment not found');
  }

  // ── Money Saved ────────────────────────────────────────
  // Assume buying new costs 10x the deposit (rough estimate)
  const buyCost = equipment.deposit * 10;
  const rentalCost = booking.totalAmount;
  const moneySaved = Math.max(0, buyCost - rentalCost);

  // ── CO2 Avoided ────────────────────────────────────────
  // Manufacturing CO2 is proportional to equipment cost
  // Renting avoids manufacturing a new unit
  const manufacturingCO2 = buyCost * CO2_PER_RUPEE * 100; // kg CO2
  const rentalCO2 = rentalCost * CO2_PER_RUPEE;
  const co2AvoidedKg = Math.round((manufacturingCO2 - rentalCO2) * 10) / 10;

  const reasoning = `Renting this ${equipment.name} saved ₹${moneySaved.toLocaleString()} ` +
    `and avoided ${co2AvoidedKg} kg CO₂ compared to buying new.`;

  logger.info('Carbon savings calculated', { bookingId, moneySaved, co2AvoidedKg });

  return {
    moneySaved,
    co2AvoidedKg,
    currency: 'inr',
    reasoning,
  };
}
