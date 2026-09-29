import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHealthScore extends Document {
  equipment: mongoose.Types.ObjectId;
  score: number;
  factors: {
    age: number;
    usageHours: number;
    serviceHistory: number;
    overdueMaintenance: number;
    damageReports: number;
    returnCondition: number;
  };
  calculatedAt: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const healthScoreSchema = new Schema<IHealthScore>(
  {
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, unique: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    factors: {
      age: { type: Number, min: 0, max: 100 },
      usageHours: { type: Number, min: 0, max: 100 },
      serviceHistory: { type: Number, min: 0, max: 100 },
      overdueMaintenance: { type: Number, min: 0, max: 100 },
      damageReports: { type: Number, min: 0, max: 100 },
      returnCondition: { type: Number, min: 0, max: 100 },
    },
    calculatedAt: { type: Date, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const HealthScore: Model<IHealthScore> = mongoose.model<IHealthScore>('HealthScore', healthScoreSchema);
