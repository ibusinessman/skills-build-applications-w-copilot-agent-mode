import { prisma } from '../../config/database';
import { redis, KEYS } from '../../config/redis';
import { env } from '../../config/env';
import { applyMargin, adjustOddsForLive, shouldSuspendOnEvent } from '../../utils/odds.utils';
import { liveQueue } from '../../jobs/queue';

export class OddsEngine {
  private readonly margin = env.BOOKMAKER_MARGIN;
  private readonly suspensionTimeout = env.SUSPENSION_TIMEOUT_MS;

  /**
   * Recalculates odds for all OPEN markets in a match, considering live state.
   */
  async recalcForMatch(matchId: string): Promise<void> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        markets: {
          where: { status: 'OPEN' },
          include: {
            outcomes: {
              include: {
                odds: { where: { isActive: true }, orderBy: { version: 'desc' }, take: 1 },
              },
            },
          },
        },
        events: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!match) return;

    const isHaitiHome = match.homeTeam.toLowerCase().includes('haiti');
    const redCardHome = match.events.filter((e) => e.type === 'RED_CARD' && e.team === match.homeTeam).length;
    const redCardAway = match.events.filter((e) => e.type === 'RED_CARD' && e.team === match.awayTeam).length;

    for (const market of match.markets) {
      if (market.category === 'MATCH_RESULT') {
        await this.recalcMatchResult(market, {
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          minute: match.minute ?? 0,
          period: match.period ?? 'FIRST_HALF',
          isHaitiHome,
          redCardHome,
          redCardAway,
          isLive: match.status === 'LIVE',
        });
      }
    }
  }

  private async recalcMatchResult(
    market: any,
    liveState: {
      homeScore: number;
      awayScore: number;
      minute: number;
      period: string;
      isHaitiHome: boolean;
      redCardHome: number;
      redCardAway: number;
      isLive: boolean;
    },
  ): Promise<void> {
    const currentOdds: Record<string, number> = {};
    let currentVersion = 1;

    for (const outcome of market.outcomes) {
      if (outcome.odds[0]) {
        currentOdds[outcome.code] = parseFloat(outcome.odds[0].value.toString());
        currentVersion = Math.max(currentVersion, outcome.odds[0].version);
      }
    }

    let newOdds = currentOdds;

    if (liveState.isLive && Object.keys(currentOdds).length > 0) {
      newOdds = adjustOddsForLive({
        baseOdds: currentOdds,
        homeScore: liveState.homeScore,
        awayScore: liveState.awayScore,
        minute: liveState.minute,
        period: liveState.period,
        isHaitiHome: liveState.isHaitiHome,
        redCardHome: liveState.redCardHome,
        redCardAway: liveState.redCardAway,
        margin: this.margin,
      });
    }

    const nextVer = currentVersion + 1;

    await prisma.$transaction(async (tx) => {
      for (const outcome of market.outcomes) {
        const newValue = newOdds[outcome.code];
        if (!newValue) continue;

        // Deactivate old odds
        await tx.odds.updateMany({
          where: { outcomeId: outcome.id, isActive: true },
          data: { isActive: false },
        });

        // Insert new versioned odds
        const newOdd = await tx.odds.create({
          data: {
            outcomeId: outcome.id,
            value: newValue,
            margin: this.margin,
            version: nextVer,
            isActive: true,
          },
        });

        // Cache in Redis for instant reads
        await redis.setex(
          KEYS.currentOdds(outcome.id),
          60,
          JSON.stringify({ value: newValue, version: nextVer, oddsId: newOdd.id }),
        );
      }

      // Update market exposure tracking
      await tx.market.update({
        where: { id: market.id },
        data: { updatedAt: new Date() },
      });
    });
  }

  /**
   * Suspends all markets for a match when a critical event occurs.
   * Markets auto-resume after suspensionTimeout ms.
   */
  async suspendMarkets(matchId: string, reason: string): Promise<void> {
    const markets = await prisma.market.findMany({
      where: { matchId, status: 'OPEN' },
    });

    await prisma.market.updateMany({
      where: { matchId, status: 'OPEN' },
      data: { status: 'SUSPENDED', suspendedAt: new Date(), suspendReason: reason },
    });

    for (const market of markets) {
      await redis.setex(KEYS.marketStatus(market.id), 300, 'SUSPENDED');
    }

    // Auto-resume job
    await liveQueue.add(
      'resume-markets',
      { matchId },
      { delay: this.suspensionTimeout, jobId: `resume-${matchId}-${Date.now()}` },
    );
  }

  async resumeMarkets(matchId: string): Promise<void> {
    await prisma.market.updateMany({
      where: { matchId, status: 'SUSPENDED' },
      data: { status: 'OPEN', suspendedAt: null, suspendReason: null },
    });

    const markets = await prisma.market.findMany({ where: { matchId } });
    for (const market of markets) {
      await redis.del(KEYS.marketStatus(market.id));
    }

    // Recalc odds after resuming
    await this.recalcForMatch(matchId);
  }

  async handleMatchEvent(matchId: string, eventType: string): Promise<void> {
    if (shouldSuspendOnEvent(eventType)) {
      await this.suspendMarkets(matchId, `Event: ${eventType}`);
    }
    await this.recalcForMatch(matchId);
  }

  async getMarketStatus(marketId: string): Promise<string> {
    const cached = await redis.get(KEYS.marketStatus(marketId));
    if (cached) return cached;
    const market = await prisma.market.findUnique({ where: { id: marketId }, select: { status: true } });
    return market?.status ?? 'CLOSED';
  }
}
