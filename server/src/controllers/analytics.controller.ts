import { Request, Response } from 'express';
import {
  getOwnerSummary,
  getOwnerRevenueTrend,
  getOwnerTopEquipment,
  getAdminSummary,
  getBookingStatusDistribution,
  getCategoryDistribution,
  getOwnerLeaderboard,
  getUserGrowth,
  getBookingPatternsByDay,
  getCancellationStats,
  getIdleAssets,
  getRetentionStats,
} from '../services/analytics.service';
import { catchAsync } from '../utils/catchAsync';

// ── Owner Analytics ─────────────────────────────────────
export const ownerSummaryHandler = catchAsync(async (req: Request, res: Response) => {
  const summary = await getOwnerSummary(req.user!.userId);
  res.json({ data: summary });
});

export const ownerRevenueTrendHandler = catchAsync(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string, 10) || 30;
  const trend = await getOwnerRevenueTrend(req.user!.userId, days);
  res.json({ data: trend });
});

export const ownerTopEquipmentHandler = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 5;
  const top = await getOwnerTopEquipment(req.user!.userId, limit);
  res.json({ data: top });
});

export const ownerBookingPatternsHandler = catchAsync(async (req: Request, res: Response) => {
  const patterns = await getBookingPatternsByDay(req.user!.userId);
  res.json({ data: patterns });
});

export const ownerCancellationStatsHandler = catchAsync(async (req: Request, res: Response) => {
  const stats = await getCancellationStats(req.user!.userId);
  res.json({ data: stats });
});

export const ownerIdleAssetsHandler = catchAsync(async (req: Request, res: Response) => {
  const idleDays = parseInt(req.query.idleDays as string, 10) || 14;
  const assets = await getIdleAssets(req.user!.userId, idleDays);
  res.json({ data: assets });
});

// ── Admin Analytics ─────────────────────────────────────
export const adminSummaryHandler = catchAsync(async (_req: Request, res: Response) => {
  const summary = await getAdminSummary();
  res.json({ data: summary });
});

export const adminBookingStatusHandler = catchAsync(async (_req: Request, res: Response) => {
  const distribution = await getBookingStatusDistribution();
  res.json({ data: distribution });
});

export const adminCategoryDistributionHandler = catchAsync(async (_req: Request, res: Response) => {
  const distribution = await getCategoryDistribution();
  res.json({ data: distribution });
});

export const adminOwnerLeaderboardHandler = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const leaderboard = await getOwnerLeaderboard(limit);
  res.json({ data: leaderboard });
});

export const adminUserGrowthHandler = catchAsync(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string, 10) || 30;
  const growth = await getUserGrowth(days);
  res.json({ data: growth });
});

export const adminRetentionStatsHandler = catchAsync(async (_req: Request, res: Response) => {
  const stats = await getRetentionStats();
  res.json({ data: stats });
});
