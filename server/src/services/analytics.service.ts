import { Booking, BookingStatus } from '../models/Booking';
import { Equipment } from '../models/Equipment';
import { User, UserRole } from '../models/User';
import { Category } from '../models/Category';
import { logger } from '../config/logger';

// ── Simple in-memory cache ──────────────────────────────
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

// ── Owner Analytics ─────────────────────────────────────
export interface OwnerSummary {
  totalRevenue: number;
  totalBookings: number;
  activeBookings: number;
  averageBookingValue: number;
  utilizationRate: number;
  totalEquipment: number;
}

export async function getOwnerSummary(ownerId: string): Promise<OwnerSummary> {
  const cacheKey = `owner-summary-${ownerId}`;
  const cached = getCached<OwnerSummary>(cacheKey);
  if (cached) return cached;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [revenueResult, bookingStats, equipmentCount, utilizationResult] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          owner: ownerId,
          status: { $in: ['CONFIRMED', 'PICKED_UP', 'IN_USE', 'RETURN_PENDING', 'RETURNED', 'INSPECTED', 'COMPLETED'] },
          deletedAt: null,
        },
      },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalBookings: { $sum: 1 } } },
    ]),
    Booking.find({
      owner: ownerId,
      status: { $in: ['CONFIRMED', 'PICKED_UP', 'IN_USE', 'RETURN_PENDING'] },
      deletedAt: null,
    }).countDocuments(),
    Equipment.countDocuments({ owner: ownerId, deletedAt: null, isActive: true }),
    Booking.aggregate([
      {
        $match: {
          owner: ownerId,
          status: { $in: ['CONFIRMED', 'PICKED_UP', 'IN_USE', 'RETURN_PENDING', 'RETURNED', 'INSPECTED', 'COMPLETED'] },
          deletedAt: null,
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
    ]),
  ]);

  const totalRevenue = revenueResult[0]?.totalRevenue ?? 0;
  const totalBookings = revenueResult[0]?.totalBookings ?? 0;
  const bookedDays = utilizationResult[0]?.bookedDays ?? 0;
  const totalDays = equipmentCount * 30;
  const utilizationRate = totalDays > 0 ? Math.round((bookedDays / totalDays) * 100) : 0;

  const summary: OwnerSummary = {
    totalRevenue,
    totalBookings,
    activeBookings: bookingStats,
    averageBookingValue: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
    utilizationRate: Math.min(utilizationRate, 100),
    totalEquipment: equipmentCount,
  };

  setCache(cacheKey, summary);
  return summary;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  bookings: number;
}

export async function getOwnerRevenueTrend(ownerId: string, days = 30): Promise<RevenueTrend[]> {
  const cacheKey = `owner-revenue-${ownerId}-${days}`;
  const cached = getCached<RevenueTrend[]>(cacheKey);
  if (cached) return cached;

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const results = await Booking.aggregate([
    {
      $match: {
        owner: ownerId,
        status: { $in: ['CONFIRMED', 'PICKED_UP', 'IN_USE', 'RETURN_PENDING', 'RETURNED', 'INSPECTED', 'COMPLETED'] },
        deletedAt: null,
        startDate: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$startDate' } },
        revenue: { $sum: '$totalAmount' },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const trend: RevenueTrend[] = results.map((r) => ({
    date: r._id,
    revenue: r.revenue,
    bookings: r.bookings,
  }));

  setCache(cacheKey, trend);
  return trend;
}

export interface TopEquipment {
  equipmentId: string;
  name: string;
  revenue: number;
  bookings: number;
  utilizationRate: number;
}

export async function getOwnerTopEquipment(ownerId: string, limit = 5): Promise<TopEquipment[]> {
  const cacheKey = `owner-top-equipment-${ownerId}-${limit}`;
  const cached = getCached<TopEquipment[]>(cacheKey);
  if (cached) return cached;

  const results = await Booking.aggregate([
    {
      $match: {
        owner: ownerId,
        status: { $in: ['CONFIRMED', 'PICKED_UP', 'IN_USE', 'RETURN_PENDING', 'RETURNED', 'INSPECTED', 'COMPLETED'] },
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: '$equipment',
        revenue: { $sum: '$totalAmount' },
        bookings: { $sum: 1 },
        bookedDays: {
          $sum: {
            $ceil: { $divide: [{ $subtract: ['$endDate', '$startDate'] }, 1000 * 60 * 60 * 24] },
          },
        },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'equipments',
        localField: '_id',
        foreignField: '_id',
        as: 'equipment',
      },
    },
    { $unwind: '$equipment' },
  ]);

  const topEquipment: TopEquipment[] = results.map((r) => ({
    equipmentId: r._id.toString(),
    name: r.equipment.name,
    revenue: r.revenue,
    bookings: r.bookings,
    utilizationRate: Math.min(Math.round((r.bookedDays / 30) * 100), 100),
  }));

  setCache(cacheKey, topEquipment);
  return topEquipment;
}

// ── Admin Analytics ─────────────────────────────────────
export interface AdminSummary {
  totalUsers: number;
  totalCustomers: number;
  totalOwners: number;
  totalEquipment: number;
  totalBookings: number;
  platformRevenue: number;
  activeBookings: number;
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const cacheKey = 'admin-summary';
  const cached = getCached<AdminSummary>(cacheKey);
  if (cached) return cached;

  const [users, equipment, bookings] = await Promise.all([
    User.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    Equipment.countDocuments({ deletedAt: null }),
    Booking.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          platformRevenue: {
            $sum: {
              $cond: [
                { $in: ['$status', ['CONFIRMED', 'PICKED_UP', 'IN_USE', 'RETURN_PENDING', 'RETURNED', 'INSPECTED', 'COMPLETED']] },
                '$totalAmount',
                0,
              ],
            },
          },
          activeBookings: {
            $sum: {
              $cond: [
                { $in: ['$status', ['CONFIRMED', 'PICKED_UP', 'IN_USE', 'RETURN_PENDING']] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const roleCounts: Record<string, number> = {};
  users.forEach((u) => { roleCounts[u._id] = u.count; });

  const summary: AdminSummary = {
    totalUsers: Object.values(roleCounts).reduce((a, b) => a + b, 0),
    totalCustomers: roleCounts[UserRole.CUSTOMER] ?? 0,
    totalOwners: roleCounts[UserRole.OWNER] ?? 0,
    totalEquipment: equipment,
    totalBookings: bookings[0]?.totalBookings ?? 0,
    platformRevenue: bookings[0]?.platformRevenue ?? 0,
    activeBookings: bookings[0]?.activeBookings ?? 0,
  };

  setCache(cacheKey, summary);
  return summary;
}

export interface BookingStatusDistribution {
  status: string;
  count: number;
}

export async function getBookingStatusDistribution(): Promise<BookingStatusDistribution[]> {
  const cacheKey = 'booking-status-distribution';
  const cached = getCached<BookingStatusDistribution[]>(cacheKey);
  if (cached) return cached;

  const results = await Booking.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const distribution = results.map((r) => ({ status: r._id, count: r.count }));
  setCache(cacheKey, distribution);
  return distribution;
}

export interface CategoryDistribution {
  category: string;
  bookings: number;
  revenue: number;
}

export async function getCategoryDistribution(): Promise<CategoryDistribution[]> {
  const cacheKey = 'category-distribution';
  const cached = getCached<CategoryDistribution[]>(cacheKey);
  if (cached) return cached;

  const results = await Booking.aggregate([
    {
      $match: {
        deletedAt: null,
        status: { $in: ['CONFIRMED', 'PICKED_UP', 'IN_USE', 'RETURN_PENDING', 'RETURNED', 'INSPECTED', 'COMPLETED'] },
      },
    },
    {
      $lookup: {
        from: 'equipments',
        localField: 'equipment',
        foreignField: '_id',
        as: 'equipment',
      },
    },
    { $unwind: '$equipment' },
    {
      $lookup: {
        from: 'categories',
        localField: 'equipment.category',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $group: {
        _id: '$category.name',
        bookings: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { bookings: -1 } },
  ]);

  const distribution = results.map((r) => ({ category: r._id, bookings: r.bookings, revenue: r.revenue }));
  setCache(cacheKey, distribution);
  return distribution;
}

export interface OwnerLeaderboard {
  ownerId: string;
  ownerName: string;
  revenue: number;
  bookings: number;
  equipmentCount: number;
}

export async function getOwnerLeaderboard(limit = 10): Promise<OwnerLeaderboard[]> {
  const cacheKey = `owner-leaderboard-${limit}`;
  const cached = getCached<OwnerLeaderboard[]>(cacheKey);
  if (cached) return cached;

  const results = await Booking.aggregate([
    {
      $match: {
        deletedAt: null,
        status: { $in: ['CONFIRMED', 'PICKED_UP', 'IN_USE', 'RETURN_PENDING', 'RETURNED', 'INSPECTED', 'COMPLETED'] },
      },
    },
    {
      $group: {
        _id: '$owner',
        revenue: { $sum: '$totalAmount' },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'owner',
      },
    },
    { $unwind: '$owner' },
    {
      $lookup: {
        from: 'equipments',
        localField: '_id',
        foreignField: 'owner',
        as: 'equipment',
      },
    },
  ]);

  const leaderboard: OwnerLeaderboard[] = results.map((r) => ({
    ownerId: r._id.toString(),
    ownerName: r.owner.name,
    revenue: r.revenue,
    bookings: r.bookings,
    equipmentCount: r.equipment.length,
  }));

  setCache(cacheKey, leaderboard);
  return leaderboard;
}

export interface UserGrowth {
  date: string;
  customers: number;
  owners: number;
}

export async function getUserGrowth(days = 30): Promise<UserGrowth[]> {
  const cacheKey = `user-growth-${days}`;
  const cached = getCached<UserGrowth[]>(cacheKey);
  if (cached) return cached;

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const results = await User.aggregate([
    { $match: { deletedAt: null, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          role: '$role',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.date',
        customers: { $sum: { $cond: [{ $eq: ['$_id.role', 'customer'] }, '$count', 0] } },
        owners: { $sum: { $cond: [{ $eq: ['$_id.role', 'owner'] }, '$count', 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const growth: UserGrowth[] = results.map((r) => ({
    date: r._id,
    customers: r.customers,
    owners: r.owners,
  }));

  setCache(cacheKey, growth);
  return growth;
}

// ── Booking Patterns ────────────────────────────────────
export interface BookingPattern {
  dayOfWeek: string;
  bookings: number;
}

export async function getBookingPatternsByDay(ownerId?: string): Promise<BookingPattern[]> {
  const cacheKey = `booking-patterns-${ownerId ?? 'all'}`;
  const cached = getCached<BookingPattern[]>(cacheKey);
  if (cached) return cached;

  const match: Record<string, unknown> = { deletedAt: null };
  if (ownerId) match.owner = ownerId;

  const results = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dayOfWeek: '$startDate' },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const patterns: BookingPattern[] = results.map((r) => ({
    dayOfWeek: days[r._id - 1],
    bookings: r.bookings,
  }));

  setCache(cacheKey, patterns);
  return patterns;
}

// ── Cancellation Rate ───────────────────────────────────
export interface CancellationStats {
  totalBookings: number;
  cancelledBookings: number;
  cancellationRate: number;
  topReasons: Array<{ reason: string; count: number }>;
}

export async function getCancellationStats(ownerId?: string): Promise<CancellationStats> {
  const cacheKey = `cancellation-stats-${ownerId ?? 'all'}`;
  const cached = getCached<CancellationStats>(cacheKey);
  if (cached) return cached;

  const match: Record<string, unknown> = { deletedAt: null };
  if (ownerId) match.owner = ownerId;

  const [total, cancelled, reasons] = await Promise.all([
    Booking.countDocuments(match),
    Booking.countDocuments({ ...match, status: BookingStatus.CANCELLED }),
    Booking.aggregate([
      { $match: { ...match, status: BookingStatus.CANCELLED, cancellationReason: { $exists: true, $ne: null } } },
      { $group: { _id: '$cancellationReason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const stats: CancellationStats = {
    totalBookings: total,
    cancelledBookings: cancelled,
    cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    topReasons: reasons.map((r) => ({ reason: r._id, count: r.count })),
  };

  setCache(cacheKey, stats);
  return stats;
}

// ── Idle Asset Report ───────────────────────────────────
export interface IdleAsset {
  equipmentId: string;
  name: string;
  city: string;
  daysIdle: number;
  lastBookingDate: string | null;
}

export async function getIdleAssets(ownerId: string, idleDays = 14): Promise<IdleAsset[]> {
  const cacheKey = `idle-assets-${ownerId}-${idleDays}`;
  const cached = getCached<IdleAsset[]>(cacheKey);
  if (cached) return cached;

  const cutoffDate = new Date(Date.now() - idleDays * 24 * 60 * 60 * 1000);

  const results = await Equipment.aggregate([
    { $match: { owner: ownerId, deletedAt: null, isActive: true } },
    {
      $lookup: {
        from: 'bookings',
        let: { eqId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$equipment', '$$eqId'] },
              deletedAt: null,
              status: { $in: ['CONFIRMED', 'PICKED_UP', 'IN_USE', 'RETURN_PENDING', 'RETURNED', 'INSPECTED', 'COMPLETED'] },
            },
          },
          { $sort: { endDate: -1 } },
          { $limit: 1 },
        ],
        as: 'lastBooking',
      },
    },
    { $unwind: { path: '$lastBooking', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        $or: [
          { lastBooking: { $exists: false } },
          { 'lastBooking.endDate': { $lt: cutoffDate } },
        ],
      },
    },
    {
      $project: {
        equipmentId: '$_id',
        name: 1,
        city: 1,
        lastBookingDate: '$lastBooking.endDate',
        daysIdle: {
          $ceil: {
            $divide: [
              { $subtract: [new Date(), { $ifNull: ['$lastBooking.endDate', '$createdAt'] }] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
    },
    { $sort: { daysIdle: -1 } },
  ]);

  const idleAssets: IdleAsset[] = results.map((r) => ({
    equipmentId: r.equipmentId.toString(),
    name: r.name,
    city: r.city,
    daysIdle: r.daysIdle,
    lastBookingDate: r.lastBookingDate ? new Date(r.lastBookingDate).toISOString() : null,
  }));

  setCache(cacheKey, idleAssets);
  return idleAssets;
}

// ── Customer Retention ──────────────────────────────────
export interface RetentionStats {
  totalCustomers: number;
  repeatCustomers: number;
  retentionRate: number;
  averageBookingsPerCustomer: number;
}

export async function getRetentionStats(): Promise<RetentionStats> {
  const cacheKey = 'retention-stats';
  const cached = getCached<RetentionStats>(cacheKey);
  if (cached) return cached;

  const results = await Booking.aggregate([
    { $match: { deletedAt: null, status: { $ne: BookingStatus.CANCELLED } } },
    {
      $group: {
        _id: '$customer',
        bookingCount: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        repeatCustomers: { $sum: { $cond: [{ $gt: ['$bookingCount', 1] }, 1, 0] } },
        totalBookings: { $sum: '$bookingCount' },
      },
    },
  ]);

  const r = results[0] ?? { totalCustomers: 0, repeatCustomers: 0, totalBookings: 0 };
  const stats: RetentionStats = {
    totalCustomers: r.totalCustomers,
    repeatCustomers: r.repeatCustomers,
    retentionRate: r.totalCustomers > 0 ? Math.round((r.repeatCustomers / r.totalCustomers) * 100) : 0,
    averageBookingsPerCustomer: r.totalCustomers > 0 ? Math.round((r.totalBookings / r.totalCustomers) * 10) / 10 : 0,
  };

  setCache(cacheKey, stats);
  return stats;
}

// ── Clear cache (call when data changes) ────────────────
export function clearAnalyticsCache(): void {
  cache.clear();
  logger.info('Analytics cache cleared');
}
