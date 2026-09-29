import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBundle extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  description: string;
  items: Array<{
    equipment: mongoose.Types.ObjectId;
    quantity: number;
  }>;
  discountPercent: number;
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bundleSchema = new Schema<IBundle>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    items: [
      {
        equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

bundleSchema.index({ owner: 1, isActive: 1 });

export const Bundle: Model<IBundle> = mongoose.model<IBundle>('Bundle', bundleSchema);
