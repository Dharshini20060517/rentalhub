import { Equipment } from '../models/Equipment';
import { Booking, BookingStatus } from '../models/Booking';
import { MaintenanceLog } from '../models/MaintenanceLog';
import { Inspection } from '../models/Inspection';
import { HealthScore } from '../models/HealthScore';
import { logger } from '../config/logger';

export interface HealthFactors {
  age: number;
  usageHours: number;
  serviceHistory: number;
  overdueMaintenance: number;
  damageReports: number;
  returnCondition: number;
}

const HEALTH_THRESHOLD = 40; // Below this, auto-schedule maintenance

/**
 * Calculate and store equipment health score (0-100).
 */
export async function calculateHealthScore(equipmentId: string): Promise<number> {
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment || equipment.deletedAt) {
    throw new Error('Equipment not found');
  }

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // ── Age Factor ─────────────────────────────────────────
  const ageDays = Math.floor((now.getTime() - equipment.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const ageScore = Math.max(0, 100 - (ageDays / 365) * 20); // Lose 20 points per year

  // ── Usage Factor ───────────────────────────────────────
  const usageResult = await Booking.aggregate([
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
        totalDays: {
          $sum: {
            $ceil: { $divide: [{ $subtract: ['$endDate', '$startDate'] }, 1000 * 60 * 60 * 24] },
          },
        },
      },
    },
  ]);
  const totalUsageDays = usageResult[0]?.totalDays ?? 0;
  const usageScore = Math.max(0, 100 - (totalUsageDays / 100) * 10); // Lose 10 points per 100 days

  // ── Service History ────────────────────────────────────
  const serviceCount = await MaintenanceLog.countDocuments({
    equipment: equipmentId,
    deletedAt: null,
    performedAt: { $gte: oneYearAgo },
  });
  const serviceScore = Math.min(100, 50 + serviceCount * 10); // Base 50, +10 per service

  // ── Overdue Maintenance ────────────────────────────────
  const overdueMaintenance = await MaintenanceLog.countDocuments({
    equipment: equipmentId,
    deletedAt: null,
    nextDueAt: { $lt: now },
  });
  const overdueScore = Math.max(0, 100 - overdueMaintenance * 30);

  // ── Damage Reports ─────────────────────────────────────
  const damageInspections = await Inspection.countDocuments({
    equipment: equipmentId,
    deletedAt: null,
    'aiAnalysis.damageDetected': true,
  });
  const damageScore = Math.max(0, 100 - damageInspections * 15);

  // ── Return Condition ───────────────────────────────────
  const returnInspections = await Inspection.find({
    equipment: equipmentId,
    deletedAt: null,
    type: 'RETURN',
    conditionRating: { $exists: true },
  }).sort({ createdAt: -1 }).limit(5);

  const avgCondition = returnInspections.length > 0
    ? returnInspections.reduce((sum, i) => sum + (i.conditionRating ?? 3), 0) / returnInspections.length
    : 4;
  const returnScore = (avgCondition / 5) * 100;

  // ── Weighted Score ─────────────────────────────────────
  const weights = { age: 0.15, usage: 0.2, service: 0.2, overdue: 0.15, damage: 0.15, return: 0.15 };
  const score = Math.round(
    ageScore * weights.age +
    usageScore * weights.usage +
    serviceScore * weights.service +
    overdueScore * weights.overdue +
    damageScore * weights.damage +
    returnScore * weights.return
  );

  const factors: HealthFactors = {
    age: Math.round(ageScore),
    usageHours: Math.round(usageScore),
    serviceHistory: Math.round(serviceScore),
    overdueMaintenance: Math.round(overdueScore),
    damageReports: Math.round(damageScore),
    returnCondition: Math.round(returnScore),
  };

  // Store health score
  await HealthScore.findOneAndUpdate(
    { equipment: equipmentId },
    { score, factors, calculatedAt: now, deletedAt: null },
    { upsert: true, new: true }
  );

  // Auto-schedule maintenance if below threshold
  if (score < HEALTH_THRESHOLD) {
    await autoScheduleMaintenance(equipmentId, score);
  }

  logger.info('Health score calculated', { equipmentId, score });
  return score;
}

/**
 * Get current health score for equipment.
 */
export async function getHealthScore(equipmentId: string): Promise<{ score: number; factors: HealthFactors } | null> {
  const healthScore = await HealthScore.findOne({ equipment: equipmentId, deletedAt: null });
  if (!healthScore) return null;
  return { score: healthScore.score, factors: healthScore.factors as HealthFactors };
}

/**
 * Auto-schedule maintenance when health score drops below threshold.
 * Creates a maintenance log entry and blocks dates.
 */
async function autoScheduleMaintenance(equipmentId: string, score: number): Promise<void> {
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment) return;

  // Create maintenance log entry
  await MaintenanceLog.create({
    equipment: equipmentId,
    owner: equipment.owner,
    type: 'REPAIR',
    description: `Auto-scheduled maintenance — health score dropped to ${score}`,
    performedAt: new Date(),
    nextDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Block dates for maintenance (set isActive to false temporarily)
  equipment.isActive = false;
  await equipment.save();

  logger.warn('Auto-maintenance scheduled', { equipmentId, score });
}
