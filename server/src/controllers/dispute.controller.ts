import { Request, Response } from 'express';
import {
  raiseDispute,
  assembleEvidence,
  suggestResolution,
  resolveDispute,
  appealDispute,
  getDisputesForAdmin,
} from '../services/dispute.service';
import { DisputeStatus, DisputeReason } from '../models/Dispute';
import { catchAsync } from '../utils/catchAsync';

export const raiseDisputeHandler = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, reason, description, evidence } = req.body;
  const dispute = await raiseDispute(bookingId, req.user!.userId, reason as DisputeReason, description, evidence ?? []);
  res.status(201).json({ data: dispute });
});

export const getEvidenceHandler = catchAsync(async (req: Request, res: Response) => {
  const evidence = await assembleEvidence(req.params.id);
  res.json({ data: evidence });
});

export const getSuggestedResolutionHandler = catchAsync(async (req: Request, res: Response) => {
  const suggestion = await suggestResolution(req.params.id);
  res.json({ data: suggestion });
});

export const resolveDisputeHandler = catchAsync(async (req: Request, res: Response) => {
  const { resolution } = req.body;
  const dispute = await resolveDispute(req.params.id, req.user!.userId, resolution);
  res.json({ data: dispute });
});

export const appealDisputeHandler = catchAsync(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const dispute = await appealDispute(req.params.id, req.user!.userId, reason);
  res.json({ data: dispute });
});

export const listDisputesHandler = catchAsync(async (req: Request, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query;
  const { disputes, total } = await getDisputesForAdmin(
    status as DisputeStatus | undefined,
    parseInt(page as string, 10),
    parseInt(limit as string, 10)
  );
  res.json({
    data: disputes,
    pagination: { page: parseInt(page as string, 10), limit: parseInt(limit as string, 10), total },
  });
});

export const getDisputeHandler = catchAsync(async (req: Request, res: Response) => {
  const { getDisputesForAdmin } = await import('../services/dispute.service');
  const { disputes } = await getDisputesForAdmin(undefined, 1, 1);
  const dispute = disputes.find((d) => d._id.toString() === req.params.id);
  if (!dispute) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Dispute not found' } });
    return;
  }
  res.json({ data: dispute });
});
