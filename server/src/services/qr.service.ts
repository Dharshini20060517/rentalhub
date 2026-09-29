import QRCode from 'qrcode';
import { Equipment } from '../models/Equipment';
import { ApiError } from '../utils/ApiError';

export interface QRData {
  equipmentId: string;
  name: string;
  ownerId: string;
  timestamp: string;
}

/**
 * Generate a QR code data URL for an equipment item.
 * The QR encodes a JSON payload with equipment info.
 */
export async function generateEquipmentQR(equipmentId: string): Promise<string> {
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment || equipment.deletedAt) {
    throw ApiError.notFound('Equipment not found');
  }

  const payload: QRData = {
    equipmentId: equipment._id.toString(),
    name: equipment.name,
    ownerId: equipment.owner.toString(),
    timestamp: new Date().toISOString(),
  };

  const dataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  return dataUrl;
}

/**
 * Parse and validate a QR code payload.
 */
export function parseQRPayload(raw: string): QRData {
  try {
    const payload = JSON.parse(raw) as QRData;
    if (!payload.equipmentId || !payload.ownerId) {
      throw new Error('Invalid QR payload');
    }
    return payload;
  } catch {
    throw ApiError.badRequest('Invalid QR code data');
  }
}
