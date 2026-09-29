import { Request, Response } from 'express';
import { uploadImage } from '../services/upload.service';
import { catchAsync } from '../utils/catchAsync';

export const uploadImageHandler = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'No file provided' } });
    return;
  }
  const result = await uploadImage(req.file);
  res.status(201).json({ data: result });
});
