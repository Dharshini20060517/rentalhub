import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  CUSTOMER = 'customer',
  OWNER = 'owner',
  ADMIN = 'admin',
}

export enum VerificationLevel {
  NONE = 'none',
  EMAIL = 'email',
  PHONE = 'phone',
  ID = 'id',
  FULL = 'full',
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: UserRole;
  verificationLevel: VerificationLevel;
  avatarUrl?: string;
  preferredLanguage: 'en' | 'ta';
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  city?: string;
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.CUSTOMER, index: true },
    verificationLevel: { type: String, enum: Object.values(VerificationLevel), default: VerificationLevel.EMAIL },
    avatarUrl: String,
    preferredLanguage: { type: String, enum: ['en', 'ta'], default: 'en' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    city: String,
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
