import { Worker } from 'bullmq';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { notificationQueue } from '../queue';

interface SettleSelectionJob {
  selectionId: string;
  betId: string;
  userId: string;
  isWin: boolean;
  stake: string | number;
  potentialWin: string | number;
}

export function startBetSettlementWorker() {
  const worker = new Worker<SettleSelectionJob>(
    'bet-settlement',
    async (job) => {
      const { betId, userId, isWin, stake, potentialWin } = job.data;

      const bet = await prisma.bet.findUnique({
        where: { id: betId },
        include: { selections: { include: { market: true } } },
      });

      if (!bet || bet.status !== 'PENDING') return;

      const allSettled = bet.selections.every((s) => s.market.status === 'SETTLED');
      if (!allSettled) return;

      // Determine overall bet result
      const allWon = bet.selections.every((s) => s.market.settlementResult !== null);
      const betWon = isWin;

      await prisma.$transaction(async (tx) => {
        await tx.bet.update({
          where: { id: betId },
          data: {
            status: betWon ? 'WON' : 'LOST',
            settledAt: new Date(),
          },
        });

        if (betWon) {
          const winAmount = parseFloat(potentialWin.toString());

          await tx.user.update({
            where: { id: userId },
            data: { balance: { increment: winAmount } },
          });

          await tx.transaction.create({
            data: {
              userId,
              type: 'BET_WIN',
              amount: winAmount,
              status: 'COMPLETED',
              idempotencyKey: `win-${betId}`,
              reference: betId,
            },
          });
        }
      });

      // Queue notification
      await notificationQueue.add('bet-settled', {
        userId,
        betId,
        won: betWon,
        amount: betWon ? parseFloat(potentialWin.toString()) : 0,
      });
    },
    { connection: { url: env.REDIS_URL }, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    console.error(`[BetSettlement] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
