import mongoose, { Schema, Document, Model } from 'mongoose';

export enum BookingStatus {
  PENDING = 'PENDING',
  HELD = 'HELD',
  CONFIRMED = 'CONFIRMED',
  PICKED_UP = 'PICKED_UP',
  IN_USE = 'IN_USE',
  RETURN_PENDING = 'RETURN_PENDING',
  RETURNED = 'RETURNED',
  INSPECTED = 'INSPECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  LATE = 'LATE',
  DISPUTED = 'DISPUTED',
}

export interface IBooking extends Document {
  equipment: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  totalAmount: number;
  depositAmount: number;
  depositHeld: boolean;
  idempotencyKey?: string;
  notes?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      index: true,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0, default: 0 },
    depositHeld: { type: Boolean, default: false },
    idempotencyKey: { type: String, sparse: true },
    notes: String,
    cancelledAt: Date,
    cancellationReason: String,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Critical compound index for overlap checks in the BookingEngine
bookingSchema.index({ equipment: 1, startDate: 1, endDate: 1, status: 1 });
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const Booking: Model<IBooking> = mongoose.model<IBooking>('Booking', bookingSchema);
