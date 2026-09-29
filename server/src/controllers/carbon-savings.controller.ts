import { Request, Response } from 'express';
import { calculateCarbonSavings } from '../services/carbon-savings.service';
import { catchAsync } from '../utils/catchAsync';

export const calculateHandler = catchAsync(async (req: Request, res: Response) => {
  const savings = await calculateCarbonSavings(req.params.bookingId);
  res.json({ data: savings });
});
