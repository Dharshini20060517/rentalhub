import { Request, Response } from 'express';
import { Inspection, InspectionType } from '../models/Inspection';
import { Booking, BookingStatus } from '../models/Booking';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export const createInspectionHandler = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, type, photos, checklist, conditionRating, notes, signature } = req.body;

  const booking = await Booking.findOne({ _id: bookingId, deletedAt: null });
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Verify booking is in correct state for inspection
  if (type === InspectionType.PICKUP && booking.status !== BookingStatus.CONFIRMED) {
    throw ApiError.conflict('Booking must be confirmed for pickup inspection');
  }
  if (type === InspectionType.RETURN && booking.status !== BookingStatus.RETURN_PENDING) {
    throw ApiError.conflict('Booking must be in return pending state for return inspection');
  }

  const inspection = await Inspection.create({
    booking: bookingId,
    equipment: booking.equipment,
    type,
    performedBy: req.user!.userId,
    photos: photos || [],
    checklist: checklist || [],
    conditionRating,
    notes,
    signature,
  });

  res.status(201).json({ data: inspection });
});

export const getInspectionsHandler = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const inspections = await Inspection.find({ booking: bookingId }).sort({ createdAt: 1 });
  res.json({ data: inspections });
});

export const getInspectionHandler = catchAsync(async (req: Request, res: Response) => {
  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) {
    throw ApiError.notFound('Inspection not found');
  }
  res.json({ data: inspection });
});

export const updateAIAnalysisHandler = catchAsync(async (req: Request, res: Response) => {
  const { damageDetected, regions, overallConfidence, reasoning } = req.body;
  const inspection = await Inspection.findByIdAndUpdate(
    req.params.id,
    {
      aiAnalysis: {
        damageDetected,
        regions: regions || [],
        overallConfidence,
        reasoning,
        analyzedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!inspection) {
    throw ApiError.notFound('Inspection not found');
  }
  res.json({ data: inspection });
});
