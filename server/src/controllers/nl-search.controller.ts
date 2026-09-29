import { Request, Response } from 'express';
import { parseSearchQuery, searchWithFilters } from '../services/nl-search.service';
import { catchAsync } from '../utils/catchAsync';

export const nlSearchHandler = catchAsync(async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Query parameter q is required' } });
    return;
  }
  const parsed = await parseSearchQuery(q);
  const results = await searchWithFilters(parsed.filters);
  res.json({ data: { parsed, results } });
});
