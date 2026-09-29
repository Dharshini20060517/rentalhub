import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEquipment extends Document {
  owner: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  name: string;
  description: string;
  images: string[];
  specs: Record<string, string | number | boolean>;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  city: string;
  address?: string;
  pricePerDay: number;
  pricePerHour?: number;
  deposit: number;
  bufferMinutes: number;
  minRentalHours: number;
  maxRentalDays: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isVerified: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentSchema = new Schema<IEquipment>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    specs: { type: Schema.Types.Mixed, default: {} },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    city: { type: String, required: true, index: true },
    address: String,
    pricePerDay: { type: Number, required: true, min: 0 },
    pricePerHour: { type: Number, min: 0 },
    deposit: { type: Number, required: true, min: 0, default: 0 },
    bufferMinutes: { type: Number, default: 60, min: 0 },
    minRentalHours: { type: Number, default: 1, min: 1 },
    maxRentalDays: { type: Number, default: 30, min: 1 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

equipmentSchema.index({ location: '2dsphere' });
equipmentSchema.index({ city: 1, category: 1 });
equipmentSchema.index({ pricePerDay: 1 });
equipmentSchema.index({ name: 'text', description: 'text' });

export const Equipment: Model<IEquipment> = mongoose.model<IEquipment>('Equipment', equipmentSchema);
