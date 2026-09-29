import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { generateEquipmentQR, parseQRPayload } from '../services/qr.service';
import { catchAsync } from '../utils/catchAsync';
import { Request, Response } from 'express';

const router = Router();

const scanSchema = z.object({
  qrData: z.string().min(1),
});

router.get(
  '/equipment/:equipmentId',
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
    const dataUrl = await generateEquipmentQR(req.params.equipmentId);
    res.json({ data: { qrCode: dataUrl } });
  })
);

router.post(
  '/scan',
  authenticate,
  validate({ body: scanSchema }),
  catchAsync(async (req: Request, res: Response) => {
    const payload = parseQRPayload(req.body.qrData);
    res.json({ data: payload });
  })
);

export default router;
