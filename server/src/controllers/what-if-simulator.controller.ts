import { Request, Response } from 'express';
import { simulatePriceChange, simulateAvailabilityChange } from '../services/what-if-simulator.service';
import { catchAsync } from '../utils/catchAsync';

export const simulatePriceHandler = catchAsync(async (req: Request, res: Response) => {
  const { newPricePerDay } = req.body;
  const result = await simulatePriceChange(req.params.equipmentId, newPricePerDay);
  res.json({ data: result });
});

export const simulateAvailabilityHandler = catchAsync(async (req: Request, res: Response) => {
  const { blockedDates } = req.body;
  const dates = blockedDates.map((d: { start: string; end: string }) => ({
    start: new Date(d.start),
    end: new Date(d.end),
  }));
  const result = await simulateAvailabilityChange(req.params.equipmentId, dates);
  res.json({ data: result });
});
