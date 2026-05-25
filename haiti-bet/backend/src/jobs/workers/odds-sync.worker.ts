import { Worker, Queue } from 'bullmq';
import { env } from '../../config/env';
import { oddsSyncService } from '../../modules/odds/odds-sync.service';

export const oddsSyncQueue = new Queue('odds-sync', {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

export function startOddsSyncWorker() {
  const worker = new Worker(
    'odds-sync',
    async (job) => {
      switch (job.name) {
        case 'sync-all': {
          const result = await oddsSyncService.syncAll();
          console.log(
            `[OddsSync] Completed: synced=${result.synced}, suspended=${result.suspended}, skipped=${result.skipped}`,
          );
          break;
        }

        case 'sync-sport': {
          const { sportKey } = job.data;
          const result = await oddsSyncService.syncSport(sportKey);
          console.log(`[OddsSync] ${sportKey}: synced=${result.synced}, suspended=${result.suspended}`);
          break;
        }

        default:
          console.warn(`[OddsSync] Unknown job name: ${job.name}`);
      }
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 1, // One sync at a time to avoid race conditions
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[OddsSync] Job ${job?.id} (${job?.name}) failed:`, err.message);
  });

  return worker;
}

/**
 * Schedules a repeating odds sync job.
 * Call this once at server startup.
 */
export async function scheduleOddsSync(): Promise<void> {
  // Remove any existing repeatable
  const repeatables = await oddsSyncQueue.getRepeatableJobs();
  for (const r of repeatables) {
    if (r.name === 'sync-all') await oddsSyncQueue.removeRepeatableByKey(r.key);
  }

  // Schedule sync every N seconds (default 60)
  await oddsSyncQueue.add(
    'sync-all',
    {},
    {
      repeat: { every: env.ODDS_SYNC_INTERVAL_MS },
      jobId: 'odds-sync-repeating',
    },
  );

  // Run an immediate first sync
  await oddsSyncQueue.add('sync-all', {}, { jobId: `odds-sync-boot-${Date.now()}` });

  console.log(`[OddsSync] Scheduled every ${env.ODDS_SYNC_INTERVAL_MS / 1000}s`);
}
