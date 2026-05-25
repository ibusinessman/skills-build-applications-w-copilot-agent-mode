import { prisma } from '../../config/database';
import { redis, KEYS } from '../../config/redis';
import { env } from '../../config/env';
import { externalOddsService } from './external-odds.service';
import { OddsEngine } from './odds.engine';
import {
  mapExternalEvents,
  extractH2hOdds,
  detectDrift,
  hasCriticalDrift,
  toProbabilities,
} from './odds.mapper';
import { applyMargin } from '../../utils/odds.utils';
import { broadcastToMatch } from '../../websocket/ws.server';
import { HAITI_SPORT_KEYS, type NormalizedOddsEvent } from './odds.types';
import { oddsRecalcQueue } from '../../jobs/queue';

const PREVIOUS_ODDS_KEY = (externalId: string) => `odds:prev:${externalId}`;

const oddsEngine = new OddsEngine();

export class OddsSyncService {
  /**
   * Main entry point: fetch Haiti events from all sport keys and sync into DB.
   */
  async syncAll(): Promise<{ synced: number; suspended: number; skipped: number }> {
    let synced = 0;
    let suspended = 0;
    let skipped = 0;

    for (const sportKey of HAITI_SPORT_KEYS) {
      try {
        const result = await this.syncSport(sportKey);
        synced += result.synced;
        suspended += result.suspended;
        skipped += result.skipped;
      } catch (err) {
        console.error(`[OddsSync] Failed for sport ${sportKey}:`, (err as Error).message);
      }
    }

    return { synced, suspended, skipped };
  }

  /**
   * Sync one sport key: fetch Haiti events, match to internal matches, update odds.
   */
  async syncSport(sportKey: string): Promise<{ synced: number; suspended: number; skipped: number }> {
    const response = await externalOddsService.getHaitiEvents(sportKey, {
      regions: ['eu'],
      markets: ['h2h', 'totals'],
      ttlSeconds: env.ODDS_CACHE_TTL_SECONDS,
    });

    const events = mapExternalEvents(response.data);
    let synced = 0;
    let suspended = 0;
    let skipped = 0;

    for (const event of events) {
      try {
        const result = await this.syncEvent(event);
        synced += result.synced ? 1 : 0;
        suspended += result.suspended ? 1 : 0;
        if (!result.synced && !result.suspended) skipped++;
      } catch (err) {
        console.error(`[OddsSync] Event ${event.externalId}:`, (err as Error).message);
        skipped++;
      }
    }

    return { synced, suspended, skipped };
  }

  /**
   * Sync a single external event into our DB.
   * Matches by externalId first, then by team names + date proximity.
   */
  private async syncEvent(
    event: NormalizedOddsEvent,
  ): Promise<{ synced: boolean; suspended: boolean }> {
    // Find matching internal match
    const match = await this.findInternalMatch(event);
    if (!match) return { synced: false, suspended: false };

    const h2hMarket = event.markets.find((m) => m.type === 'h2h');
    if (!h2hMarket) return { synced: false, suspended: false };

    // Check for significant odds drift before updating
    const previousOdds = await this.getPreviousOdds(event.externalId);
    const currentOdds = Object.fromEntries(h2hMarket.outcomes.map((o) => [o.code, o.odds]));

    if (previousOdds) {
      const drifts = detectDrift(previousOdds, currentOdds);
      if (hasCriticalDrift(drifts)) {
        const worstDrift = Math.max(...drifts.map((d) => d.driftPercent));
        console.log(
          `[OddsSync] Critical drift (${worstDrift.toFixed(1)}%) for ${event.homeTeam} vs ${event.awayTeam} — suspending`,
        );
        await oddsEngine.suspendMarkets(match.id, `External odds drift: ${worstDrift.toFixed(1)}%`);
        broadcastToMatch(match.id, {
          type: 'MARKET_STATUS',
          matchId: match.id,
          data: { status: 'SUSPENDED', reason: 'Odds movement detected' },
        });
        // Schedule recalc after drift settles
        await oddsRecalcQueue.add('recalc', { matchId: match.id }, { delay: 15000 });
        return { synced: false, suspended: true };
      }
    }

    // Store current odds as previous snapshot for next sync
    await redis.setex(PREVIOUS_ODDS_KEY(event.externalId), env.ODDS_STALE_TTL_SECONDS, JSON.stringify(currentOdds));

    // Convert to internal probability format and apply our margin
    const probabilities = toProbabilities(h2hMarket.outcomes);
    const priced = applyMargin(probabilities, env.BOOKMAKER_MARGIN);

    // Update internal markets for this match
    await this.updateInternalMarket(match.id, priced, h2hMarket.outcomes);

    // Broadcast updated odds via WebSocket
    broadcastToMatch(match.id, {
      type: 'ODDS',
      matchId: match.id,
      data: { source: 'external', outcomes: priced },
    });

    // Also sync totals market if present
    const totalsMarket = event.markets.find((m) => m.type === 'totals');
    if (totalsMarket) {
      await this.syncTotalsMarket(match.id, totalsMarket.outcomes);
    }

    // Update externalId on match if not set
    if (!match.externalId) {
      await prisma.match.update({
        where: { id: match.id },
        data: { externalId: event.externalId },
      });
    }

    return { synced: true, suspended: false };
  }

  /**
   * Updates the MATCH_RESULT market odds using external prices.
   */
  private async updateInternalMarket(
    matchId: string,
    priced: Array<{ code: string; pricedOdds: number }>,
    sourceOutcomes: Array<{ code: string; name: string }>,
  ): Promise<void> {
    let market = await prisma.market.findFirst({
      where: { matchId, category: 'MATCH_RESULT', status: { not: 'CANCELLED' } },
      include: { outcomes: { include: { odds: { where: { isActive: true }, take: 1 } } } },
    });

    if (!market) {
      // Auto-create market if it doesn't exist yet
      market = await prisma.market.create({
        data: {
          matchId,
          name: 'Résultat du match (1X2)',
          category: 'MATCH_RESULT',
          status: 'OPEN',
          outcomes: {
            create: sourceOutcomes.map((o) => ({ name: o.name, code: o.code })),
          },
        },
        include: { outcomes: { include: { odds: { where: { isActive: true }, take: 1 } } } },
      });
    }

    if (market.status === 'SETTLED' || market.status === 'CANCELLED') return;

    const nextVersion = Math.max(...market.outcomes.flatMap((o) => o.odds.map((x) => x.version)), 0) + 1;

    await prisma.$transaction(async (tx) => {
      for (const outcome of market!.outcomes) {
        const price = priced.find((p) => p.code === outcome.code);
        if (!price) continue;

        // Deactivate old
        await tx.odds.updateMany({ where: { outcomeId: outcome.id, isActive: true }, data: { isActive: false } });

        // Insert new versioned odds
        const newOdd = await tx.odds.create({
          data: {
            outcomeId: outcome.id,
            value: price.pricedOdds,
            margin: env.BOOKMAKER_MARGIN,
            version: nextVersion,
            isActive: true,
          },
        });

        // Cache for fast reads
        await redis.setex(
          KEYS.currentOdds(outcome.id),
          60,
          JSON.stringify({ value: price.pricedOdds, version: nextVersion, oddsId: newOdd.id }),
        );
      }
    });
  }

  /**
   * Upserts the GOALS (totals) market from external data.
   */
  private async syncTotalsMarket(
    matchId: string,
    outcomes: Array<{ code: string; name: string; odds: number; point?: number }>,
  ): Promise<void> {
    const market = await prisma.market.findFirst({
      where: { matchId, category: 'GOALS', status: { not: 'CANCELLED' } },
      include: { outcomes: { include: { odds: { where: { isActive: true }, take: 1 } } } },
    });

    const over = outcomes.find((o) => o.code === 'OVER');
    const under = outcomes.find((o) => o.code === 'UNDER');
    if (!over || !under) return;

    const label = over.point !== undefined ? `${over.point} buts` : '2.5 buts';

    if (!market) {
      await prisma.market.create({
        data: {
          matchId,
          name: `Plus/Moins de ${label}`,
          category: 'GOALS',
          status: 'OPEN',
          outcomes: {
            create: [
              { name: `Plus de ${label}`, code: 'OVER' },
              { name: `Moins de ${label}`, code: 'UNDER' },
            ],
          },
        },
        include: { outcomes: true },
      });
      return;
    }

    // Update existing
    for (const outcome of market.outcomes) {
      const price = outcome.code === 'OVER' ? over : under;
      if (!price) continue;

      const nextVer = Math.max(...outcome.odds.map((o) => o.version), 0) + 1;
      await prisma.odds.updateMany({ where: { outcomeId: outcome.id, isActive: true }, data: { isActive: false } });
      await prisma.odds.create({
        data: {
          outcomeId: outcome.id,
          value: price.odds,
          margin: env.BOOKMAKER_MARGIN,
          version: nextVer,
          isActive: true,
        },
      });
    }
  }

  /**
   * Finds an internal match for an external event.
   * First tries externalId, then fuzzy team+date match.
   */
  private async findInternalMatch(event: NormalizedOddsEvent) {
    // 1. Exact externalId
    const byId = await prisma.match.findUnique({ where: { externalId: event.externalId } });
    if (byId) return byId;

    // 2. Team name + date proximity (±24h)
    const windowStart = new Date(event.commenceTime.getTime() - 24 * 60 * 60 * 1000);
    const windowEnd = new Date(event.commenceTime.getTime() + 24 * 60 * 60 * 1000);

    const candidates = await prisma.match.findMany({
      where: {
        scheduledAt: { gte: windowStart, lte: windowEnd },
        status: { not: 'FINISHED' },
      },
    });

    for (const c of candidates) {
      const home = c.homeTeam.toLowerCase();
      const away = c.awayTeam.toLowerCase();
      const extHome = event.homeTeam.toLowerCase();
      const extAway = event.awayTeam.toLowerCase();

      const homeMatch = home.includes(extHome.slice(0, 4)) || extHome.includes(home.slice(0, 4));
      const awayMatch = away.includes(extAway.slice(0, 4)) || extAway.includes(away.slice(0, 4));

      if (homeMatch && awayMatch) return c;
    }

    return null;
  }

  private async getPreviousOdds(externalId: string): Promise<Record<string, number> | null> {
    const raw = await redis.get(PREVIOUS_ODDS_KEY(externalId));
    return raw ? JSON.parse(raw) : null;
  }
}

export const oddsSyncService = new OddsSyncService();
