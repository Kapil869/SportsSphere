import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

const RETRY_MS = 15000;
let retryTimer = null;
let indexesBuilt = false;

/** True only while the driver has an open connection. */
export const isDbReady = () => mongoose.connection.readyState === 1;

async function buildIndexes() {
  if (indexesBuilt) return;
  indexesBuilt = true;
  try {
    await Promise.all(Object.values(mongoose.models).map((m) => m.createIndexes()));
    logger.info('MongoDB indexes are in place');
  } catch (err) {
    indexesBuilt = false;
    logger.warn('Could not build MongoDB indexes:', err.message);
  }
}

mongoose.connection.on('connected', buildIndexes);
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected; the driver will keep retrying'));

function scheduleRetry() {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connectDB();
  }, RETRY_MS);
  retryTimer.unref?.();
}

/**
 * Connects once and returns true/false. The API keeps serving (from GNews + memory cache)
 * when MongoDB is down, and this function retries in the background until it connects.
 */
export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    logger.info('MongoDB connected');
    return true;
  } catch (err) {
    logger.warn(`MongoDB unavailable (${err.message}). Running without persistence; retrying in ${RETRY_MS / 1000}s.`);
    scheduleRetry();
    return false;
  }
}

export async function disconnectDB() {
  clearTimeout(retryTimer);
  await mongoose.disconnect();
}
