import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableAutoPipelining: true,
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

export const KEYS = {
  currentOdds: (outcomeId: string) => `odds:current:${outcomeId}`,
  marketStatus: (marketId: string) => `market:status:${marketId}`,
  matchLive: (matchId: string) => `match:live:${matchId}`,
  userSession: (userId: string) => `session:${userId}`,
  betSlipLock: (userId: string) => `bet:lock:${userId}`,
  otpAttempts: (phone: string) => `otp:attempts:${phone}`,
  moncashToken: (orderId: string) => `moncash:token:${orderId}`,
  liveSubscribers: (matchId: string) => `live:subs:${matchId}`,
} as const;

export async function connectRedis(): Promise<void> {
  await redis.connect();
}
