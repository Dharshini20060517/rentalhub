import mongoose, { Schema, Document, Model } from 'mongoose';

export enum NotificationType {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  DISPUTE_CREATED = 'DISPUTE_CREATED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',
  WAITLIST_OFFER = 'WAITLIST_OFFER',
  SYSTEM = 'SYSTEM',
}

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    readAt: Date,
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
// TTL index for stale notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const Notification: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);
