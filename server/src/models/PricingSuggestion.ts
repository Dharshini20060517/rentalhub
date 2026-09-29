import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPricingSuggestion extends Document {
  equipment: mongoose.Types.ObjectId;
  suggestedPrice: number;
  confidence: number;
  reasoning: string;
  factors: {
    historicalDemand: number;
    seasonality: number;
    dayOfWeek: number;
    leadTime: number;
    utilization: number;
    localEvents: number;
    competitorBand: number;
  };
  validFrom: Date;
  validUntil: Date;
  accepted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pricingSuggestionSchema = new Schema<IPricingSuggestion>(
  {
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    suggestedPrice: { type: Number, required: true, min: 0 },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    reasoning: { type: String, required: true },
    factors: {
      historicalDemand: Number,
      seasonality: Number,
      dayOfWeek: Number,
      leadTime: Number,
      utilization: Number,
      localEvents: Number,
      competitorBand: Number,
    },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    accepted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

pricingSuggestionSchema.index({ equipment: 1, createdAt: -1 });

export const PricingSuggestion: Model<IPricingSuggestion> = mongoose.model<IPricingSuggestion>(
  'PricingSuggestion',
  pricingSuggestionSchema
);
