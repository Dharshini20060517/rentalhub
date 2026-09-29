import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== 'production',
    serverSelectionTimeoutMS: 5000,
  });
  console.log(`[db] Connected to MongoDB at ${env.mongoUri}`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('[db] Disconnected from MongoDB');
}
