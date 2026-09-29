import { Request, Response } from 'express';
import { createBundleBooking, getBundles, createBundle } from '../services/bundle.service';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

export const createBundleBookingHandler = catchAsync(async (req: Request, res: Response) => {
  const { bundleId, startDate, endDate, idempotencyKey } = req.body;
  const bookings = await createBundleBooking(
    req.user!.userId,
    bundleId,
    new Date(startDate),
    new Date(endDate),
    idempotencyKey
  );
  res.status(201).json({ data: bookings });
});

export const listBundlesHandler = catchAsync(async (req: Request, res: Response) => {
  const bundles = await getBundles(req.query.ownerId as string | undefined);
  res.json({ data: bundles });
});

export const createBundleHandler = catchAsync(async (req: Request, res: Response) => {
  const { name, description, items, discountPercent } = req.body;
  const bundle = await createBundle(req.user!.userId, name, description, items, discountPercent);
  res.status(201).json({ data: bundle });
});
