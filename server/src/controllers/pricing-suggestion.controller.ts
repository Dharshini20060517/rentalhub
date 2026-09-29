import { Request, Response } from 'express';
import { generatePricingSuggestion, getLatestPricingSuggestion } from '../services/pricing-suggestion.service';
import { catchAsync } from '../utils/catchAsync';

export const generateSuggestionHandler = catchAsync(async (req: Request, res: Response) => {
  const suggestion = await generatePricingSuggestion(req.params.equipmentId);
  res.json({ data: suggestion });
});

export const getLatestSuggestionHandler = catchAsync(async (req: Request, res: Response) => {
  const suggestion = await getLatestPricingSuggestion(req.params.equipmentId);
  if (!suggestion) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No pricing suggestion found' } });
    return;
  }
  res.json({ data: suggestion });
});
