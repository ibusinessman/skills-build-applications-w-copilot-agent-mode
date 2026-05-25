import { Worker } from 'bullmq';
import { OddsEngine } from '../../modules/odds/odds.engine';
import { env } from '../../config/env';

const oddsEngine = new OddsEngine();

export function startOddsRecalcWorker() {
  const worker = new Worker(
    'odds-recalc',
    async (job) => {
      const { matchId, eventType } = job.data;

      if (eventType) {
        await oddsEngine.handleMatchEvent(matchId, eventType);
      } else {
        await oddsEngine.recalcForMatch(matchId);
      }
    },
    { connection: { url: env.REDIS_URL }, concurrency: 3 },
  );

  worker.on('failed', (job, err) => {
    console.error(`[OddsRecalc] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
