import mongoose, { Schema, Document, Model } from 'mongoose';

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  APPEALED = 'APPEALED',
}

export enum DisputeReason {
  DAMAGE = 'DAMAGE',
  LATE_RETURN = 'LATE_RETURN',
  ITEM_NOT_AS_DESCRIBED = 'ITEM_NOT_AS_DESCRIBED',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  OTHER = 'OTHER',
}

export interface IDispute extends Document {
  booking: mongoose.Types.ObjectId;
  raisedBy: mongoose.Types.ObjectId;
  against: mongoose.Types.ObjectId;
  reason: DisputeReason;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  aiSuggestion?: {
    suggestedResolution: string;
    confidence: number;
    reasoning: string;
  };
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const disputeSchema = new Schema<IDispute>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    against: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, enum: Object.values(DisputeReason), required: true },
    description: { type: String, required: true },
    evidence: [{ type: String }],
    status: { type: String, enum: Object.values(DisputeStatus), default: DisputeStatus.OPEN, index: true },
    resolution: String,
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    aiSuggestion: {
      suggestedResolution: String,
      confidence: Number,
      reasoning: String,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

disputeSchema.index({ status: 1, createdAt: -1 });

export const Dispute: Model<IDispute> = mongoose.model<IDispute>('Dispute', disputeSchema);
