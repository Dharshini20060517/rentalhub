import { Equipment } from '../models/Equipment';
import { MaintenanceLog } from '../models/MaintenanceLog';
import { Inspection } from '../models/Inspection';
import { DamageRegion } from './ai-vision.service';
import { logger } from '../config/logger';

export interface DamageEstimate {
  minCost: number;
  maxCost: number;
  currency: string;
  confidence: number;
  reasoning: string;
  factors: {
    severityScore: number;
    regionCount: number;
    historicalAverage: number;
    equipmentValue: number;
  };
}

/**
 * Estimate repair cost from AI damage report and equipment repair history.
 */
export async function estimateDamageCost(
  equipmentId: string,
  regions: DamageRegion[]
): Promise<DamageEstimate> {
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment || equipment.deletedAt) {
    throw new Error('Equipment not found');
  }

  // ── Severity Score ─────────────────────────────────────
  const severityWeights = { low: 0.3, medium: 0.6, high: 1.0 };
  const severityScore = regions.length > 0
    ? regions.reduce((sum, r) => sum + severityWeights[r.severity], 0) / regions.length
    : 0;

  // ── Historical Repair Costs ────────────────────────────
  const repairHistory = await MaintenanceLog.find({
    equipment: equipmentId,
    deletedAt: null,
    type: { $in: ['REPAIR', 'PARTS_REPLACEMENT'] },
    cost: { $exists: true, $gt: 0 },
  }).sort({ performedAt: -1 }).limit(10);

  const historicalAverage = repairHistory.length > 0
    ? repairHistory.reduce((sum, r) => sum + (r.cost ?? 0), 0) / repairHistory.length
    : equipment.pricePerDay * 2; // Default: 2 days rental

  // ── Equipment Value Factor ─────────────────────────────
  const equipmentValue = equipment.deposit || equipment.pricePerDay * 10;

  // ── Calculate Cost Range ───────────────────────────────
  const baseCost = historicalAverage * severityScore;
  const regionMultiplier = 1 + regions.length * 0.2;
  const minCost = Math.round(baseCost * regionMultiplier * 0.7);
  const maxCost = Math.round(baseCost * regionMultiplier * 1.3);

  // ── Confidence ─────────────────────────────────────────
  const confidence = Math.min(0.3 + repairHistory.length * 0.1 + regions.length * 0.05, 0.9);

  // ── Reasoning ──────────────────────────────────────────
  const reasons: string[] = [];
  if (regions.length > 0) {
    reasons.push(`${regions.length} damage region(s) detected`);
    const highSeverity = regions.filter((r) => r.severity === 'high').length;
    if (highSeverity > 0) reasons.push(`${highSeverity} high-severity`);
  }
  if (repairHistory.length > 0) {
    reasons.push(`Based on ${repairHistory.length} previous repair(s)`);
  }
  reasons.push(`Equipment value: ₹${equipmentValue.toLocaleString()}`);

  const reasoning = reasons.join('. ');

  logger.info('Damage cost estimated', { equipmentId, minCost, maxCost, confidence });

  return {
    minCost,
    maxCost,
    currency: 'inr',
    confidence,
    reasoning,
    factors: {
      severityScore: Math.round(severityScore * 100) / 100,
      regionCount: regions.length,
      historicalAverage: Math.round(historicalAverage),
      equipmentValue,
    },
  };
}
