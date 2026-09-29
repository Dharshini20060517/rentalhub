import { Request, Response } from 'express';
import { calculateTrustScore, getTrustScore, getDepositMultiplier, shouldAutoApprove } from '../services/trust-score.service';
import { catchAsync } from '../utils/catchAsync';

export const calculateHandler = catchAsync(async (req: Request, res: Response) => {
  const score = await calculateTrustScore(req.params.userId);
  res.json({ data: { score } });
});

export const getHandler = catchAsync(async (req: Request, res: Response) => {
  const trustScore = await getTrustScore(req.params.userId);
  if (!trustScore) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trust score not found' } });
    return;
  }
  res.json({ data: trustScore });
});

export const depositMultiplierHandler = catchAsync(async (req: Request, res: Response) => {
  const score = parseInt(req.query.score as string, 10) || 50;
  const multiplier = getDepositMultiplier(score);
  const autoApprove = shouldAutoApprove(score);
  res.json({ data: { multiplier, autoApprove } });
});
