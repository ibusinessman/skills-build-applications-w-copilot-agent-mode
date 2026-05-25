import { Worker } from 'bullmq';
import { OddsEngine } from '../../modules/odds/odds.engine';
import { env } from '../../config/env';

const oddsEngine = new OddsEngine();

export function startLiveWorker() {
  const worker = new Worker(
    'live-events',
    async (job) => {
      if (job.name === 'resume-markets') {
        await oddsEngine.resumeMarkets(job.data.matchId);
      }
    },
    { connection: { url: env.REDIS_URL }, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    console.error(`[Live] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
