import { prisma } from '../../config/database';
import { redis, KEYS } from '../../config/redis';
import { applyMargin } from '../../utils/odds.utils';
import { env } from '../../config/env';

interface CreateMarketInput {
  matchId: string;
  name: string;
  category: 'MATCH_RESULT' | 'GOALS' | 'HANDICAP' | 'PLAYER' | 'LIVE' | 'SPECIAL';
  isLive?: boolean;
  outcomes: Array<{ name: string; code: string; initialProbability: number }>;
}

export class MarketsService {
  async createMarket(input: CreateMarketInput) {
    const market = await prisma.$transaction(async (tx) => {
      const m = await tx.market.create({
        data: {
          matchId: input.matchId,
          name: input.name,
          category: input.category,
          isLive: input.isLive ?? false,
          status: 'OPEN',
        },
      });

      const pricedOutcomes = applyMargin(
        input.outcomes.map((o) => ({ code: o.code, probability: o.initialProbability })),
        env.BOOKMAKER_MARGIN,
      );

      for (const outcome of input.outcomes) {
        const priced = pricedOutcomes.find((p) => p.code === outcome.code)!;
        const mo = await tx.marketOutcome.create({
          data: { marketId: m.id, name: outcome.name, code: outcome.code },
        });
        await tx.odds.create({
          data: {
            outcomeId: mo.id,
            value: priced.pricedOdds,
            margin: env.BOOKMAKER_MARGIN,
            version: 1,
            isActive: true,
          },
        });
      }

      return m;
    });

    return this.getMarketWithOdds(market.id);
  }

  async getMarketWithOdds(marketId: string) {
    return prisma.market.findUnique({
      where: { id: marketId },
      include: {
        outcomes: {
          include: {
            odds: { where: { isActive: true }, orderBy: { version: 'desc' }, take: 1 },
          },
        },
      },
    });
  }

  async getMarketsForMatch(matchId: string, category?: string) {
    return prisma.market.findMany({
      where: {
        matchId,
        status: { not: 'CANCELLED' },
        ...(category ? { category: category as any } : {}),
      },
      include: {
        outcomes: {
          include: {
            odds: { where: { isActive: true }, orderBy: { version: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async setMarketStatus(marketId: string, status: 'OPEN' | 'SUSPENDED' | 'CLOSED') {
    const market = await prisma.market.update({
      where: { id: marketId },
      data: {
        status,
        suspendedAt: status === 'SUSPENDED' ? new Date() : null,
      },
    });

    if (status === 'SUSPENDED') {
      await redis.setex(KEYS.marketStatus(marketId), 300, 'SUSPENDED');
    } else {
      await redis.del(KEYS.marketStatus(marketId));
    }

    return market;
  }

  async settleMarket(marketId: string, winningOutcomeCode: string) {
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: { outcomes: true },
    });

    if (!market) throw new Error('Market not found');
    if (market.status === 'SETTLED') throw new Error('Market already settled');

    const winningOutcome = market.outcomes.find((o) => o.code === winningOutcomeCode);
    if (!winningOutcome) throw new Error(`Outcome '${winningOutcomeCode}' not found`);

    await prisma.market.update({
      where: { id: marketId },
      data: {
        status: 'SETTLED',
        settledAt: new Date(),
        settlementResult: winningOutcomeCode,
      },
    });

    return { marketId, winningOutcomeCode };
  }

  async getExposure(marketId: string): Promise<Record<string, number>> {
    const selections = await prisma.betSelection.findMany({
      where: {
        marketId,
        bet: { status: 'PENDING' },
      },
      include: {
        bet: { select: { totalStake: true, potentialWin: true } },
        outcome: { select: { code: true } },
      },
    });

    const exposure: Record<string, number> = {};
    for (const sel of selections) {
      const code = sel.outcome.code;
      if (!exposure[code]) exposure[code] = 0;
      exposure[code] += parseFloat(sel.bet.potentialWin.toString());
    }
    return exposure;
  }
}
