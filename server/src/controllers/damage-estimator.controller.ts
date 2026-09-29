import { Request, Response } from 'express';
import { estimateDamageCost } from '../services/damage-estimator.service';
import { catchAsync } from '../utils/catchAsync';

export const estimateDamageHandler = catchAsync(async (req: Request, res: Response) => {
  const { equipmentId, regions } = req.body;
  const estimate = await estimateDamageCost(equipmentId, regions);
  res.json({ data: estimate });
});
