import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Booking, BookingStatus } from '../models/Booking';
import { Equipment } from '../models/Equipment';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export const createReviewHandler = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, rating, comment, conditionRating } = req.body;

  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null });
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Only completed bookings can be reviewed
  if (booking.status !== BookingStatus.COMPLETED) {
    throw ApiError.conflict('Can only review completed bookings');
  }

  // Only the customer can review
  if (booking.customer.toString() !== req.user!.userId) {
    throw ApiError.forbidden('Only the customer can review this booking');
  }

  // Check for existing review
  const existing = await Review.findOne({ booking: bookingId });
  if (existing) {
    throw ApiError.conflict('Review already exists for this booking');
  }

  const review = await Review.create({
    booking: bookingId,
    reviewer: req.user!.userId,
    reviewee: booking.owner,
    equipment: booking.equipment,
    rating,
    comment,
    conditionRating,
    isVerifiedRental: true,
  });

  // Update equipment rating
  const equipment = await Equipment.findById(booking.equipment);
  if (equipment) {
    const newCount = equipment.reviewCount + 1;
    const newRating = (equipment.rating * equipment.reviewCount + rating) / newCount;
    equipment.rating = Math.round(newRating * 10) / 10;
    equipment.reviewCount = newCount;
    await equipment.save();
  }

  res.status(201).json({ data: review });
});

export const listReviewsHandler = catchAsync(async (req: Request, res: Response) => {
  const { equipmentId, ownerId, page = '1', limit = '20' } = req.query;
  const filter: Record<string, unknown> = { deletedAt: null };
  if (equipmentId) filter.equipment = equipmentId;
  if (ownerId) filter.reviewee = ownerId;

  const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('reviewer', 'name avatarUrl')
      .populate('equipment', 'name images')
      .skip(skip)
      .limit(parseInt(limit as string, 10))
      .sort({ createdAt: -1 }),
    Review.countDocuments(filter),
  ]);

  res.json({
    data: reviews,
    pagination: { page: parseInt(page as string, 10), limit: parseInt(limit as string, 10), total },
  });
});

export const getReviewHandler = catchAsync(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id).populate('reviewer', 'name avatarUrl');
  if (!review || review.deletedAt) {
    throw ApiError.notFound('Review not found');
  }
  res.json({ data: review });
});

export const deleteReviewHandler = catchAsync(async (req: Request, res: Response) => {
  const review = await Review.findOneAndUpdate(
    { _id: req.params.id, reviewer: req.user!.userId },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!review) {
    throw ApiError.notFound('Review not found');
  }
  res.json({ data: { message: 'Review deleted' } });
});
