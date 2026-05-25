import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { oddsRecalcQueue } from '../../jobs/queue';
import { broadcastToMatch } from '../../websocket/ws.server';
import { OddsEngine } from '../odds/odds.engine';
import { shouldSuspendOnEvent } from '../../utils/odds.utils';

const oddsEngine = new OddsEngine();

export interface LiveUpdate {
  matchId: string;
  type: 'SCORE' | 'EVENT' | 'STATUS' | 'ODDS';
  payload: any;
}

export class LiveService {
  /**
   * Main handler for all live match events.
   * Called by admin or external data feed.
   */
  async processLiveEvent(event: {
    matchId: string;
    eventType: string;
    minute: number;
    team: string;
    player?: string;
    description?: string;
  }): Promise<void> {
    const { matchId, eventType } = event;

    // 1. Persist event
    const matchEvent = await prisma.matchEvent.create({
      data: {
        matchId,
        type: eventType,
        minute: event.minute,
        team: event.team,
        player: event.player,
        description: event.description,
      },
    });

    // 2. Update score if goal
    if (eventType === 'GOAL') {
      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (match) {
        const isHome = event.team === match.homeTeam;
        const updated = await prisma.match.update({
          where: { id: matchId },
          data: isHome ? { homeScore: { increment: 1 } } : { awayScore: { increment: 1 } },
        });

        broadcastToMatch(matchId, {
          type: 'SCORE',
          matchId,
          data: { homeScore: updated.homeScore, awayScore: updated.awayScore, minute: event.minute },
        });
      }
    }

    // 3. Broadcast event
    broadcastToMatch(matchId, {
      type: 'MATCH_EVENT',
      matchId,
      data: matchEvent,
    });

    await redis.publish('live:all', JSON.stringify({ type: 'MATCH_EVENT', matchId, data: matchEvent }));

    // 4. Suspend markets if critical event, then recalc
    if (shouldSuspendOnEvent(eventType)) {
      await oddsEngine.suspendMarkets(matchId, `Event: ${eventType} min ${event.minute}`);
      broadcastToMatch(matchId, {
        type: 'MARKET_STATUS',
        matchId,
        data: { status: 'SUSPENDED', reason: eventType },
      });
    }

    // 5. Queue odds recalculation
    await oddsRecalcQueue.add(
      'recalc',
      { matchId, eventType },
      { jobId: `recalc-${matchId}-${Date.now()}`, delay: shouldSuspendOnEvent(eventType) ? 5000 : 0 },
    );
  }

  async updateMatchStatus(matchId: string, status: string, minute?: number): Promise<void> {
    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: status as any,
        minute: minute ?? undefined,
        ...(status === 'HALFTIME' ? { period: 'HALFTIME' } : {}),
        ...(status === 'LIVE' && minute !== undefined && minute <= 45 ? { period: 'FIRST_HALF' } : {}),
        ...(status === 'LIVE' && minute !== undefined && minute > 45 ? { period: 'SECOND_HALF' } : {}),
      },
    });

    broadcastToMatch(matchId, {
      type: 'MATCH_STATUS',
      matchId,
      data: { status: match.status, minute: match.minute, period: match.period },
    });

    await redis.publish('live:all', JSON.stringify({ type: 'MATCH_STATUS', matchId, data: { status } }));
  }

  async broadcastOddsUpdate(matchId: string): Promise<void> {
    const markets = await prisma.market.findMany({
      where: { matchId, status: 'OPEN' },
      include: {
        outcomes: {
          include: {
            odds: { where: { isActive: true }, orderBy: { version: 'desc' }, take: 1 },
          },
        },
      },
    });

    broadcastToMatch(matchId, {
      type: 'ODDS',
      matchId,
      data: markets,
    });
  }
}
