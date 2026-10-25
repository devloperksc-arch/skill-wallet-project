import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log(`✅  MongoDB connected: ${mongoose.connection.host}`);
}

export function getDBStatus() {
  const state = mongoose.connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  return state === 1 ? 'connected' : 'disconnected';
}
