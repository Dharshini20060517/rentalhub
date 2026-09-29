import { Request, Response } from 'express';
import { Waitlist, WaitlistStatus } from '../models/Waitlist';
import { Equipment } from '../models/Equipment';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export const joinWaitlistHandler = catchAsync(async (req: Request, res: Response) => {
  const { equipmentId, startDate, endDate } = req.body;

  const equipment = await Equipment.findOne({ _id: equipmentId, deletedAt: null, isActive: true });
  if (!equipment) {
    throw ApiError.notFound('Equipment not found');
  }

  // Check for existing waitlist entry
  const existing = await Waitlist.findOne({
    equipment: equipmentId,
    customer: req.user!.userId,
    status: WaitlistStatus.WAITING,
  });
  if (existing) {
    throw ApiError.conflict('Already on waitlist for this equipment');
  }

  const entry = await Waitlist.create({
    equipment: equipmentId,
    customer: req.user!.userId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    status: WaitlistStatus.WAITING,
  });

  res.status(201).json({ data: entry });
});

export const listWaitlistHandler = catchAsync(async (req: Request, res: Response) => {
  const entries = await Waitlist.find({ customer: req.user!.userId })
    .populate({
      path: 'equipment',
      populate: { path: 'category', select: 'name slug' },
      match: { deletedAt: null },
    })
    .sort({ createdAt: -1 });
  res.json({ data: entries });
});

export const cancelWaitlistHandler = catchAsync(async (req: Request, res: Response) => {
  const entry = await Waitlist.findOneAndUpdate(
    { _id: req.params.id, customer: req.user!.userId },
    { status: WaitlistStatus.CANCELLED },
    { new: true }
  );
  if (!entry) {
    throw ApiError.notFound('Waitlist entry not found');
  }
  res.json({ data: entry });
});

export const getWaitlistForEquipmentHandler = catchAsync(async (req: Request, res: Response) => {
  const entries = await Waitlist.find({
    equipment: req.params.equipmentId,
    status: WaitlistStatus.WAITING,
  })
    .populate('customer', 'name email')
    .sort({ createdAt: 1 });
  res.json({ data: entries });
});
