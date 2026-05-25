import { prisma } from '../../config/database';
import { redis, KEYS } from '../../config/redis';
import { env } from '../../config/env';
import { calculatePotentialWin } from '../../utils/odds.utils';
import { betSettlementQueue } from '../../jobs/queue';

interface BetSelection {
  marketId: string;
  outcomeId: string;
}

interface PlaceBetInput {
  userId: string;
  stake: number;
  selections: BetSelection[];
  idempotencyKey: string;
}

export class BetsService {
  async placeBet(input: PlaceBetInput) {
    const { userId, stake, selections, idempotencyKey } = input;

    // Idempotency check
    const existing = await prisma.bet.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;

    // Validate stake limits
    if (stake < env.MIN_BET_STAKE) throw new Error(`Minimum stake is ${env.MIN_BET_STAKE} HTG`);
    if (stake > env.MAX_BET_STAKE) throw new Error(`Maximum stake is ${env.MAX_BET_STAKE} HTG`);
    if (selections.length < 1) throw new Error('At least one selection required');
    if (selections.length > 8) throw new Error('Maximum 8 selections per bet');

    // Distributed lock to prevent double-bet
    const lockKey = KEYS.betSlipLock(userId);
    const locked = await redis.set(lockKey, '1', 'EX', 10, 'NX');
    if (!locked) throw new Error('Another bet is being processed. Please wait.');

    try {
      return await this.processBet(userId, stake, selections, idempotencyKey);
    } finally {
      await redis.del(lockKey);
    }
  }

  private async processBet(
    userId: string,
    stake: number,
    selections: BetSelection[],
    idempotencyKey: string,
  ) {
    return prisma.$transaction(async (tx) => {
      // Check user balance and status
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      if (user.status !== 'ACTIVE') throw new Error('Account not active');
      if (parseFloat(user.balance.toString()) < stake) throw new Error('Insufficient balance');

      // Validate all markets are open and get current odds
      const oddsValues: number[] = [];
      const validatedSelections: Array<{
        marketId: string;
        outcomeId: string;
        oddsValue: number;
        oddsVersion: number;
      }> = [];

      for (const sel of selections) {
        const market = await tx.market.findUnique({
          where: { id: sel.marketId },
          include: {
            outcomes: {
              where: { id: sel.outcomeId },
              include: {
                odds: { where: { isActive: true }, orderBy: { version: 'desc' }, take: 1 },
              },
            },
          },
        });

        if (!market) throw new Error(`Market ${sel.marketId} not found`);
        if (market.status !== 'OPEN') throw new Error(`Market '${market.name}' is not open for betting`);

        const outcome = market.outcomes[0];
        if (!outcome) throw new Error(`Outcome ${sel.outcomeId} not found`);
        if (!outcome.odds[0]) throw new Error('No active odds available');

        const oddsValue = parseFloat(outcome.odds[0].value.toString());
        oddsValues.push(oddsValue);
        validatedSelections.push({
          marketId: sel.marketId,
          outcomeId: sel.outcomeId,
          oddsValue,
          oddsVersion: outcome.odds[0].version,
        });
      }

      const potentialWin = calculatePotentialWin(stake, oddsValues);

      // Check market exposure limit
      for (const sel of validatedSelections) {
        const market = await tx.market.findUnique({ where: { id: sel.marketId } });
        if (!market) continue;
        const currentExposure = parseFloat(market.totalExposure.toString());
        if (currentExposure + potentialWin > env.MAX_EXPOSURE_PER_MARKET) {
          throw new Error(`Market '${sel.marketId}' has reached maximum exposure`);
        }
        await tx.market.update({
          where: { id: sel.marketId },
          data: { totalExposure: { increment: potentialWin } },
        });
      }

      // Deduct stake from balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: stake } },
      });

      // Create stake transaction
      await tx.transaction.create({
        data: {
          userId,
          type: 'BET_STAKE',
          amount: stake,
          status: 'COMPLETED',
          idempotencyKey: `stake-${idempotencyKey}`,
        },
      });

      // Create bet
      const bet = await tx.bet.create({
        data: {
          userId,
          totalStake: stake,
          potentialWin,
          status: 'PENDING',
          idempotencyKey,
          selections: {
            create: validatedSelections,
          },
        },
        include: { selections: { include: { outcome: true, market: true } } },
      });

      return bet;
    });
  }

  async getUserBets(userId: string, status?: string) {
    return prisma.bet.findMany({
      where: {
        userId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        selections: {
          include: {
            market: { select: { id: true, name: true, category: true, status: true } },
            outcome: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { placedAt: 'desc' },
      take: 50,
    });
  }

  async getBetById(betId: string, userId?: string) {
    return prisma.bet.findFirst({
      where: { id: betId, ...(userId ? { userId } : {}) },
      include: {
        selections: {
          include: {
            market: true,
            outcome: true,
          },
        },
      },
    });
  }

  async settleBetsForMarket(marketId: string, winningOutcomeCode: string): Promise<void> {
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: { outcomes: true },
    });

    if (!market) return;

    const winningOutcome = market.outcomes.find((o) => o.code === winningOutcomeCode);
    if (!winningOutcome) return;

    const pendingSelections = await prisma.betSelection.findMany({
      where: { marketId, bet: { status: 'PENDING' } },
      include: { bet: true, outcome: true },
    });

    for (const selection of pendingSelections) {
      const isWin = selection.outcomeId === winningOutcome.id;
      await betSettlementQueue.add('settle-selection', {
        selectionId: selection.id,
        betId: selection.betId,
        userId: selection.bet.userId,
        isWin,
        stake: selection.bet.totalStake,
        potentialWin: selection.bet.potentialWin,
      });
    }
  }
}
