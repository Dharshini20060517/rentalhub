import { Request, Response } from 'express';
import { calculateHealthScore, getHealthScore } from '../services/health-score.service';
import { catchAsync } from '../utils/catchAsync';

export const calculateHandler = catchAsync(async (req: Request, res: Response) => {
  const score = await calculateHealthScore(req.params.equipmentId);
  res.json({ data: { score } });
});

export const getHandler = catchAsync(async (req: Request, res: Response) => {
  const healthScore = await getHealthScore(req.params.equipmentId);
  if (!healthScore) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Health score not found' } });
    return;
  }
  res.json({ data: healthScore });
});
