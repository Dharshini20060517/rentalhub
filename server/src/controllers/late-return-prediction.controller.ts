import { Request, Response } from 'express';
import { predictLateReturn, getLateReturnRisks } from '../services/late-return-prediction.service';
import { catchAsync } from '../utils/catchAsync';

export const predictHandler = catchAsync(async (req: Request, res: Response) => {
  const prediction = await predictLateReturn(req.params.bookingId);
  res.json({ data: prediction });
});

export const lateReturnRisksHandler = catchAsync(async (req: Request, res: Response) => {
  const ownerId = req.user!.role === 'owner' || req.user!.role === 'admin' ? req.user!.userId : undefined;
  const risks = await getLateReturnRisks(ownerId);
  res.json({ data: risks });
});
