import { Request, Response } from 'express';
import { analyzeDamage } from '../services/ai-vision.service';
import { catchAsync } from '../utils/catchAsync';

export const analyzeDamageHandler = catchAsync(async (req: Request, res: Response) => {
  const { beforeImageUrl, afterImageUrl, equipmentId } = req.body;
  const result = await analyzeDamage(beforeImageUrl, afterImageUrl, equipmentId);
  res.json({ data: result });
});
