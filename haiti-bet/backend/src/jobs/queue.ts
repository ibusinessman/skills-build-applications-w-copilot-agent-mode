import { Queue } from 'bullmq';
import { env } from '../config/env';

const connection = { url: env.REDIS_URL };

export const betSettlementQueue = new Queue('bet-settlement', { connection });
export const oddsRecalcQueue = new Queue('odds-recalc', { connection });
export const notificationQueue = new Queue('notifications', { connection });
export const liveQueue = new Queue('live-events', { connection });

export const queues = [betSettlementQueue, oddsRecalcQueue, notificationQueue, liveQueue];
