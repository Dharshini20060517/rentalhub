import { Request, Response } from 'express';
import { getRecommendations, getFrequentlyRentedTogether, getSimilarAvailable } from '../services/recommendation.service';
import { catchAsync } from '../utils/catchAsync';

export const recommendationsHandler = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 6;
  const recommendations = await getRecommendations(req.user!.userId, limit);
  res.json({ data: recommendations });
});

export const frequentlyRentedTogetherHandler = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 4;
  const items = await getFrequentlyRentedTogether(req.params.equipmentId, limit);
  res.json({ data: items });
});

export const similarAvailableHandler = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 4;
  const items = await getSimilarAvailable(req.params.equipmentId, limit);
  res.json({ data: items });
});
