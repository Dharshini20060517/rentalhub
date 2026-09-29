import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBookingHold extends Document {
  equipment: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  expiresAt: Date;
  idempotencyKey: string;
  createdAt: Date;
}

const bookingHoldSchema = new Schema<IBookingHold>(
  {
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index: MongoDB auto-deletes expired holds
bookingHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
bookingHoldSchema.index({ equipment: 1, startDate: 1, endDate: 1 });

export const BookingHold: Model<IBookingHold> = mongoose.model<IBookingHold>('BookingHold', bookingHoldSchema);
