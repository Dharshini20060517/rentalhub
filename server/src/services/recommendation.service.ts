import { Equipment, IEquipment } from '../models/Equipment';
import { Booking, BookingStatus } from '../models/Booking';
import { logger } from '../config/logger';

export interface Recommendation {
  equipment: IEquipment;
  score: number;
  reason: string;
}

/**
 * Get personalized recommendations for a user.
 * Hybrid: content-based (category, specs, price) + collaborative (co-booked, similar users).
 */
export async function getRecommendations(userId: string, limit = 6): Promise<Recommendation[]> {
  // Get user's booking history
  const userBookings = await Booking.find({
    customer: userId,
    deletedAt: null,
    status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.INSPECTED] },
  }).populate('equipment', 'category pricePerDay specs');

  const bookedEquipmentIds = userBookings.map((b) => b.equipment._id.toString());
  const preferredCategories = [...new Set(userBookings.map((b) => (b.equipment as unknown as { category: { _id: string } }).category._id.toString()))];
  const avgPrice = userBookings.length > 0
    ? userBookings.reduce((sum, b) => sum + (b.equipment as unknown as { pricePerDay: number }).pricePerDay, 0) / userBookings.length
    : 1000;

  // Content-based: same category, similar price, not already booked
  const contentBased = await Equipment.find({
    deletedAt: null,
    isActive: true,
    _id: { $nin: bookedEquipmentIds },
    category: { $in: preferredCategories },
  }).limit(limit * 2);

  // Collaborative: equipment frequently booked by users with similar history
  const similarUsers = await Booking.aggregate([
    {
      $match: {
        equipment: { $in: userBookings.map((b) => b.equipment._id) },
        deletedAt: null,
        customer: { $ne: userId },
      },
    },
    { $group: { _id: '$customer', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const similarUserIds = similarUsers.map((u) => u._id);
  const collaborativeEquipment = await Booking.aggregate([
    {
      $match: {
        customer: { $in: similarUserIds },
        deletedAt: null,
        equipment: { $nin: bookedEquipmentIds.map((id) => ({ _id: id })) },
      },
    },
    { $group: { _id: '$equipment', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  // Score and rank
  const recommendations: Recommendation[] = [];

  for (const eq of contentBased) {
    const priceDiff = Math.abs(eq.pricePerDay - avgPrice) / avgPrice;
    const priceScore = Math.max(0, 1 - priceDiff);
    const ratingScore = eq.rating / 5;
    const score = priceScore * 0.4 + ratingScore * 0.6;
    recommendations.push({
      equipment: eq,
      score,
      reason: `Because you rented similar ${eq.category} equipment`,
    });
  }

  for (const collab of collaborativeEquipment) {
    const eq = await Equipment.findById(collab._id);
    if (eq && !eq.deletedAt && eq.isActive) {
      recommendations.push({
        equipment: eq,
        score: 0.7,
        reason: 'Frequently rented together with items you have booked',
      });
    }
  }

  // Sort by score and return top N
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get equipment frequently rented together with the given equipment.
 */
export async function getFrequentlyRentedTogether(equipmentId: string, limit = 4): Promise<Recommendation[]> {
  // Find bookings that include this equipment
  const bookings = await Booking.find({
    equipment: equipmentId,
    deletedAt: null,
    status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.INSPECTED] },
  }).select('_id');

  // Find other equipment in those bookings
  const coBooked = await Booking.aggregate([
    {
      $match: {
        _id: { $in: bookings.map((b) => b._id) },
        equipment: { $ne: equipmentId },
        deletedAt: null,
      },
    },
    { $group: { _id: '$equipment', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  const recommendations: Recommendation[] = [];
  for (const item of coBooked) {
    const eq = await Equipment.findById(item._id);
    if (eq && !eq.deletedAt && eq.isActive) {
      recommendations.push({
        equipment: eq,
        score: Math.min(item.count / 5, 1),
        reason: `Rented together ${item.count} times`,
      });
    }
  }

  return recommendations;
}

/**
 * Get similar available alternatives for equipment that is booked.
 */
export async function getSimilarAvailable(equipmentId: string, limit = 4): Promise<Recommendation[]> {
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment || equipment.deletedAt) return [];

  const similar = await Equipment.find({
    deletedAt: null,
    isActive: true,
    _id: { $ne: equipmentId },
    category: equipment.category,
    pricePerDay: { $gte: equipment.pricePerDay * 0.7, $lte: equipment.pricePerDay * 1.3 },
  })
    .sort({ rating: -1 })
    .limit(limit);

  return similar.map((eq) => ({
    equipment: eq,
    score: eq.rating / 5,
    reason: `Similar ${eq.category} equipment at ₹${eq.pricePerDay}/day`,
  }));
}
