import mongoose, { Schema, Document, Model } from 'mongoose';

export enum FraudFlagType {
  RAPID_MULTI_ACCOUNT = 'RAPID_MULTI_ACCOUNT',
  PHOTO_METADATA_MISMATCH = 'PHOTO_METADATA_MISMATCH',
  UNUSUAL_CANCELLATION = 'UNUSUAL_CANCELLATION',
  SUSPICIOUS_BOOKING_PATTERN = 'SUSPICIOUS_BOOKING_PATTERN',
}

export enum FraudFlagStatus {
  OPEN = 'OPEN',
  REVIEWED = 'REVIEWED',
  DISMISSED = 'DISMISSED',
}

export interface IFraudFlag extends Document {
  user: mongoose.Types.ObjectId;
  type: FraudFlagType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence: Record<string, unknown>;
  status: FraudFlagStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const fraudFlagSchema = new Schema<IFraudFlag>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(FraudFlagType), required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    description: { type: String, required: true },
    evidence: { type: Schema.Types.Mixed },
    status: { type: String, enum: Object.values(FraudFlagStatus), default: FraudFlagStatus.OPEN, index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

fraudFlagSchema.index({ status: 1, severity: 1, createdAt: -1 });

export const FraudFlag: Model<IFraudFlag> = mongoose.model<IFraudFlag>('FraudFlag', fraudFlagSchema);
