import mongoose, { Schema, Document, Model } from 'mongoose';

export enum WaitlistStatus {
  WAITING = 'WAITING',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface IWaitlist extends Document {
  equipment: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: WaitlistStatus;
  offeredAt?: Date;
  offerExpiresAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const waitlistSchema = new Schema<IWaitlist>(
  {
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: Object.values(WaitlistStatus), default: WaitlistStatus.WAITING, index: true },
    offeredAt: Date,
    offerExpiresAt: Date,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

waitlistSchema.index({ equipment: 1, status: 1, createdAt: 1 });

export const Waitlist: Model<IWaitlist> = mongoose.model<IWaitlist>('Waitlist', waitlistSchema);
