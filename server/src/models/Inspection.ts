import mongoose, { Schema, Document, Model } from 'mongoose';

export enum InspectionType {
  PICKUP = 'PICKUP',
  RETURN = 'RETURN',
}

export interface IInspection extends Document {
  booking: mongoose.Types.ObjectId;
  equipment: mongoose.Types.ObjectId;
  type: InspectionType;
  performedBy: mongoose.Types.ObjectId;
  photos: Array<{
    url: string;
    hash: string;
    takenAt: Date;
    angle?: string;
  }>;
  checklist?: Array<{
    item: string;
    ok: boolean;
    note?: string;
  }>;
  conditionRating?: number;
  notes?: string;
  aiAnalysis?: {
    damageDetected: boolean;
    regions: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      label: string;
      severity: 'low' | 'medium' | 'high';
      confidence: number;
    }>;
    overallConfidence: number;
    reasoning: string;
    analyzedAt: Date;
  };
  signature?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inspectionSchema = new Schema<IInspection>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    type: { type: String, enum: Object.values(InspectionType), required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    photos: [
      {
        url: { type: String, required: true },
        hash: { type: String, required: true },
        takenAt: { type: Date, required: true },
        angle: String,
      },
    ],
    checklist: [
      {
        item: { type: String, required: true },
        ok: { type: Boolean, required: true },
        note: String,
      },
    ],
    conditionRating: { type: Number, min: 1, max: 5 },
    notes: String,
    aiAnalysis: {
      damageDetected: Boolean,
      regions: [
        {
          x: Number,
          y: Number,
          width: Number,
          height: Number,
          label: String,
          severity: { type: String, enum: ['low', 'medium', 'high'] },
          confidence: Number,
        },
      ],
      overallConfidence: Number,
      reasoning: String,
      analyzedAt: Date,
    },
    signature: String,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

inspectionSchema.index({ booking: 1, type: 1 });

export const Inspection: Model<IInspection> = mongoose.model<IInspection>('Inspection', inspectionSchema);
