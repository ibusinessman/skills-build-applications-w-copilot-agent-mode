import { Worker } from 'bullmq';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

export function startNotificationWorker() {
  const worker = new Worker(
    'notifications',
    async (job) => {
      const { userId, type } = job.data;

      let title = '';
      let body = '';

      switch (type) {
        case 'bet-settled':
          title = job.data.won ? 'Felisitasyon! Ou genyen!' : 'Pari ou a pèdi';
          body = job.data.won
            ? `Ou te genyen ${job.data.amount.toFixed(2)} HTG!`
            : 'Pari ou a pèdi. Eseye ankò!';
          break;
        case 'deposit-confirmed':
          title = 'Depo konfime';
          body = `${job.data.amount.toFixed(2)} HTG te ajoute nan kont ou.`;
          break;
        case 'withdrawal-processed':
          title = 'Retrè trete';
          body = `${job.data.amount.toFixed(2)} HTG ap voye nan ${job.data.phone}.`;
          break;
        case 'market-live':
          title = 'Match kòmanse!';
          body = `${job.data.matchName} kòmanse kounye a. Plase pari w!`;
          break;
        default:
          return;
      }

      await prisma.notification.create({
        data: { userId, title, body, type, metadata: job.data },
      });
    },
    { connection: { url: env.REDIS_URL }, concurrency: 10 },
  );

  worker.on('failed', (job, err) => {
    console.error(`[Notification] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
