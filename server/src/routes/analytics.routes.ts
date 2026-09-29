import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '../models/User';
import {
  ownerSummaryHandler,
  ownerRevenueTrendHandler,
  ownerTopEquipmentHandler,
  ownerBookingPatternsHandler,
  ownerCancellationStatsHandler,
  ownerIdleAssetsHandler,
  adminSummaryHandler,
  adminBookingStatusHandler,
  adminCategoryDistributionHandler,
  adminOwnerLeaderboardHandler,
  adminUserGrowthHandler,
  adminRetentionStatsHandler,
} from '../controllers/analytics.controller';

const router = Router();

const daysQuerySchema = z.object({ days: z.string().optional() });
const limitQuerySchema = z.object({ limit: z.string().optional() });
const idleDaysQuerySchema = z.object({ idleDays: z.string().optional() });

// Owner analytics
router.get('/owner/summary', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), ownerSummaryHandler);
router.get('/owner/revenue-trend', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), validate({ query: daysQuerySchema }), ownerRevenueTrendHandler);
router.get('/owner/top-equipment', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), validate({ query: limitQuerySchema }), ownerTopEquipmentHandler);
router.get('/owner/booking-patterns', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), ownerBookingPatternsHandler);
router.get('/owner/cancellation-stats', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), ownerCancellationStatsHandler);
router.get('/owner/idle-assets', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), validate({ query: idleDaysQuerySchema }), ownerIdleAssetsHandler);

// Admin analytics
router.get('/admin/summary', authenticate, requireRole(UserRole.ADMIN), adminSummaryHandler);
router.get('/admin/booking-status', authenticate, requireRole(UserRole.ADMIN), adminBookingStatusHandler);
router.get('/admin/category-distribution', authenticate, requireRole(UserRole.ADMIN), adminCategoryDistributionHandler);
router.get('/admin/owner-leaderboard', authenticate, requireRole(UserRole.ADMIN), validate({ query: limitQuerySchema }), adminOwnerLeaderboardHandler);
router.get('/admin/user-growth', authenticate, requireRole(UserRole.ADMIN), validate({ query: daysQuerySchema }), adminUserGrowthHandler);
router.get('/admin/retention-stats', authenticate, requireRole(UserRole.ADMIN), adminRetentionStatsHandler);

export default router;
