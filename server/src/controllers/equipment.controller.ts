import { Request, Response } from 'express';
import { Equipment } from '../models/Equipment';
import { Booking, BookingStatus } from '../models/Booking';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export const listEquipmentHandler = catchAsync(async (req: Request, res: Response) => {
  const { category, city, minPrice, maxPrice, minRating, search, page = '1', limit = '20', lat, lng, radius, availableFrom, availableTo } = req.query;
  const filter: Record<string, unknown> = { deletedAt: null, isActive: true };
  if (category) filter.category = category;
  if (city) filter.city = city;
  if (minPrice || maxPrice) {
    filter.pricePerDay = {};
    if (minPrice) (filter.pricePerDay as Record<string, number>).$gte = parseFloat(minPrice as string);
    if (maxPrice) (filter.pricePerDay as Record<string, number>).$lte = parseFloat(maxPrice as string);
  }
  if (minRating) filter.rating = { $gte: parseFloat(minRating as string) };
  if (search) {
    filter.$text = { $search: search as string };
  }
  if (lat && lng && radius) {
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng as string), parseFloat(lat as string)] },
        $maxDistance: parseFloat(radius as string) * 1000,
      },
    };
  }

  // Date availability: exclude equipment that has overlapping confirmed/held bookings
  if (availableFrom && availableTo) {
    const from = new Date(availableFrom as string);
    const to = new Date(availableTo as string);
    const overlapping = await Booking.find({
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.HELD, BookingStatus.PICKED_UP, BookingStatus.IN_USE] },
      startDate: { $lte: to },
      endDate: { $gte: from },
      deletedAt: null,
    }).distinct('equipment');
    filter._id = { $nin: overlapping };
  }

  const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
  const [items, total] = await Promise.all([
    Equipment.find(filter).skip(skip).limit(parseInt(limit as string, 10)).sort({ createdAt: -1 }),
    Equipment.countDocuments(filter),
  ]);
  res.json({
    data: items,
    pagination: { page: parseInt(page as string, 10), limit: parseInt(limit as string, 10), total },
  });
});

export const getEquipmentHandler = catchAsync(async (req: Request, res: Response) => {
  const equipment = await Equipment.findById(req.params.id).populate('category', 'name slug');
  if (!equipment || equipment.deletedAt) {
    throw ApiError.notFound('Equipment not found');
  }
  res.json({ data: equipment });
});

export const getAvailabilityHandler = catchAsync(async (req: Request, res: Response) => {
  const { start, end } = req.query;
  const startDate = start ? new Date(start as string) : new Date();
  const endDate = end ? new Date(end as string) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const bookings = await Booking.find({
    equipment: req.params.id,
    status: { $in: [BookingStatus.CONFIRMED, BookingStatus.HELD, BookingStatus.PICKED_UP, BookingStatus.IN_USE] },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
    deletedAt: null,
  }).select('startDate endDate status');

  // Generate array of booked date ranges
  const bookedRanges = bookings.map((b) => ({
    from: b.startDate.toISOString().split('T')[0],
    to: b.endDate.toISOString().split('T')[0],
    status: b.status,
  }));

  res.json({ data: { equipmentId: req.params.id, startDate, endDate, bookedRanges } });
});

export const createEquipmentHandler = catchAsync(async (req: Request, res: Response) => {
  const equipment = await Equipment.create({ ...req.body, owner: req.user!.userId });
  res.status(201).json({ data: equipment });
});

export const updateEquipmentHandler = catchAsync(async (req: Request, res: Response) => {
  const equipment = await Equipment.findOneAndUpdate(
    { _id: req.params.id, owner: req.user!.userId },
    req.body,
    { new: true }
  );
  if (!equipment) {
    throw ApiError.notFound('Equipment not found or you do not own it');
  }
  res.json({ data: equipment });
});

export const deleteEquipmentHandler = catchAsync(async (req: Request, res: Response) => {
  const equipment = await Equipment.findOneAndUpdate(
    { _id: req.params.id, owner: req.user!.userId },
    { deletedAt: new Date(), isActive: false },
    { new: true }
  );
  if (!equipment) {
    throw ApiError.notFound('Equipment not found or you do not own it');
  }
  res.json({ data: { message: 'Equipment deleted' } });
});
