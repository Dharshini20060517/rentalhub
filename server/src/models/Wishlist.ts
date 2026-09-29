import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWishlist extends Document {
  user: mongoose.Types.ObjectId;
  equipment: mongoose.Types.ObjectId;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

wishlistSchema.index({ user: 1, equipment: 1 }, { unique: true });
wishlistSchema.index({ user: 1, createdAt: -1 });

export const Wishlist: Model<IWishlist> = mongoose.model<IWishlist>('Wishlist', wishlistSchema);
