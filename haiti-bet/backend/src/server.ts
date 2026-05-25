import { buildApp } from './app';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { env } from './config/env';
import { startBetSettlementWorker } from './jobs/workers/bet-settlement.worker';
import { startOddsRecalcWorker } from './jobs/workers/odds-recalc.worker';
import { startNotificationWorker } from './jobs/workers/notification.worker';
import { startLiveWorker } from './jobs/workers/live.worker';

async function main() {
  // Connect to databases
  await connectDB();
  console.log('[DB] PostgreSQL connected');

  await connectRedis();
  console.log('[Redis] Connected');

  // Start background workers
  startBetSettlementWorker();
  startOddsRecalcWorker();
  startNotificationWorker();
  startLiveWorker();
  console.log('[Workers] All workers started');

  // Build and start Fastify
  const app = await buildApp();

  await app.listen({ port: env.PORT, host: env.HOST });
  console.log(`[Server] Haiti Bet API running on http://${env.HOST}:${env.PORT}`);
}

main().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('[Server] Shutting down...');
  process.exit(0);
});
