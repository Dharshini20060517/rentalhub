import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  booking: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId;
  reviewee: mongoose.Types.ObjectId;
  equipment: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  conditionRating?: number;
  isVerifiedRental: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    conditionRating: { type: Number, min: 1, max: 5 },
    isVerifiedRental: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reviewSchema.index({ equipment: 1, rating: -1 });
reviewSchema.index({ reviewee: 1, createdAt: -1 });

export const Review: Model<IReview> = mongoose.model<IReview>('Review', reviewSchema);
