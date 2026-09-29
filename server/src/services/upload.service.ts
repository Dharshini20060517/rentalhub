import { env } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';
import fs from 'fs';
import path from 'path';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  url: string;
  publicId: string;
}

function validateFile(mimetype: string, size: number): void {
  if (!ALLOWED_MIME.includes(mimetype)) {
    throw ApiError.badRequest(`Invalid file type: ${mimetype}. Allowed: ${ALLOWED_MIME.join(', ')}`);
  }
  if (size > MAX_SIZE) {
    throw ApiError.badRequest(`File too large: ${size} bytes. Max: ${MAX_SIZE} bytes`);
  }
}

/**
 * Upload an image to Cloudinary if configured, otherwise save locally.
 * In production, always use Cloudinary/S3.
 */
export async function uploadImage(file: Express.Multer.File): Promise<UploadResult> {
  validateFile(file.mimetype, file.size);

  if (env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret) {
    return uploadToCloudinary(file);
  }

  // Local fallback for development
  return uploadLocal(file);
}

async function uploadToCloudinary(file: Express.Multer.File): Promise<UploadResult> {
  try {
    const cloudinary = (await import('cloudinary')).v2;
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
    });

    const result = await new Promise<UploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'rentalhub', resource_type: 'image' },
        (error: unknown, result: { secure_url?: string; public_id?: string } | undefined) => {
          if (error || !result || !result.secure_url || !result.public_id) {
            reject(ApiError.internal('Cloudinary upload failed'));
          } else {
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        }
      );
      stream.end(file.buffer);
    });

    logger.info('Image uploaded to Cloudinary', { publicId: result.publicId });
    return result;
  } catch (err) {
    logger.error('Cloudinary upload failed, falling back to local', { error: (err as Error).message });
    return uploadLocal(file);
  }
}

async function uploadLocal(file: Express.Multer.File): Promise<UploadResult> {
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
  const filepath = path.join(uploadDir, filename);
  fs.writeFileSync(filepath, file.buffer);
  const url = `/uploads/${filename}`;
  logger.info('Image saved locally', { url });
  return { url, publicId: filename };
}

export async function deleteImage(publicId: string): Promise<void> {
  if (env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret) {
    try {
      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({
        cloud_name: env.cloudinary.cloudName,
        api_key: env.cloudinary.apiKey,
        api_secret: env.cloudinary.apiSecret,
      });
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      logger.warn('Failed to delete image from Cloudinary', { publicId, error: (err as Error).message });
    }
  }
  // Local files are left in place (can be cleaned by a cron job)
}
