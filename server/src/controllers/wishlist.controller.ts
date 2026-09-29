import { Request, Response } from 'express';
import { Wishlist } from '../models/Wishlist';
import { Equipment } from '../models/Equipment';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export const addToWishlistHandler = catchAsync(async (req: Request, res: Response) => {
  const { equipmentId } = req.body;
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment || equipment.deletedAt) {
    throw ApiError.notFound('Equipment not found');
  }
  const existing = await Wishlist.findOne({ user: req.user!.userId, equipment: equipmentId });
  if (existing) {
    throw ApiError.conflict('Already in wishlist');
  }
  const item = await Wishlist.create({ user: req.user!.userId, equipment: equipmentId });
  res.status(201).json({ data: item });
});

export const removeFromWishlistHandler = catchAsync(async (req: Request, res: Response) => {
  const { equipmentId } = req.params;
  const result = await Wishlist.findOneAndDelete({ user: req.user!.userId, equipment: equipmentId });
  if (!result) {
    throw ApiError.notFound('Wishlist item not found');
  }
  res.json({ data: { message: 'Removed from wishlist' } });
});

export const listWishlistHandler = catchAsync(async (req: Request, res: Response) => {
  const items = await Wishlist.find({ user: req.user!.userId })
    .populate({
      path: 'equipment',
      populate: { path: 'category', select: 'name slug' },
      match: { deletedAt: null },
    })
    .sort({ createdAt: -1 });
  res.json({ data: items });
});
