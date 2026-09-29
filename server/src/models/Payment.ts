import mongoose, { Schema, Document, Model } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentType {
  DEPOSIT = 'DEPOSIT',
  RENTAL = 'RENTAL',
  LATE_FEE = 'LATE_FEE',
  DAMAGE = 'DAMAGE',
  REFUND = 'REFUND',
}

export interface IPayment extends Document {
  booking: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'inr' },
    type: { type: String, enum: Object.values(PaymentType), required: true },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING, index: true },
    stripePaymentIntentId: String,
    stripeChargeId: String,
    idempotencyKey: { type: String, sparse: true },
    metadata: { type: Schema.Types.Mixed },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
paymentSchema.index({ customer: 1, createdAt: -1 });

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);
