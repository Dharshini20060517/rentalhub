import { Request, Response } from 'express';
import { detectFraudFlags, getFraudFlags, reviewFraudFlag } from '../services/fraud-detection.service';
import { FraudFlagStatus } from '../models/FraudFlag';
import { catchAsync } from '../utils/catchAsync';

export const detectHandler = catchAsync(async (req: Request, res: Response) => {
  const flags = await detectFraudFlags(req.params.userId);
  res.json({ data: flags });
});

export const listFlagsHandler = catchAsync(async (req: Request, res: Response) => {
  const flags = await getFraudFlags(
    req.query.status as FraudFlagStatus | undefined,
    req.query.severity as string | undefined
  );
  res.json({ data: flags });
});

export const reviewFlagHandler = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.body;
  const flag = await reviewFraudFlag(req.params.id, req.user!.userId, status as FraudFlagStatus);
  res.json({ data: flag });
});
