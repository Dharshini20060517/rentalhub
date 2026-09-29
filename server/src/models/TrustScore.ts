import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrustScore extends Document {
  user: mongoose.Types.ObjectId;
  score: number;
  factors: {
    onTimeReturns: number;
    damageHistory: number;
    disputeOutcomes: number;
    cancellationRate: number;
    verificationLevel: number;
    reviewQuality: number;
  };
  calculatedAt: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const trustScoreSchema = new Schema<ITrustScore>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    factors: {
      onTimeReturns: { type: Number, min: 0, max: 100 },
      damageHistory: { type: Number, min: 0, max: 100 },
      disputeOutcomes: { type: Number, min: 0, max: 100 },
      cancellationRate: { type: Number, min: 0, max: 100 },
      verificationLevel: { type: Number, min: 0, max: 100 },
      reviewQuality: { type: Number, min: 0, max: 100 },
    },
    calculatedAt: { type: Date, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const TrustScore: Model<ITrustScore> = mongoose.model<ITrustScore>('TrustScore', trustScoreSchema);
