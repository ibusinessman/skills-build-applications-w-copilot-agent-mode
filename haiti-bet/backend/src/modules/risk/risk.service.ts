import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';

const MAX_DAILY_STAKE_PER_USER = 500_000; // HTG
const MAX_ACTIVE_BETS = 20;
const RECENT_BET_WINDOW_SECONDS = 60;
const RECENT_BET_RATE_LIMIT = 5;

function todayKey(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export class RiskService {
  /**
   * Validates a bet placement against all risk rules.
   * Throws a descriptive Error on any violation.
   */
  async validateBet(
    userId: string,
    stake: number,
    selections: Array<{ marketId: string; outcomeId: string; oddsValue: number }>,
    potentialWin: number,
  ): Promise<void> {
    // 1. Stake within global min/max bounds
    if (stake < env.MIN_BET_STAKE) {
      throw new Error(`Minimum stake is ${env.MIN_BET_STAKE} HTG`);
    }
    if (stake > env.MAX_BET_STAKE) {
      throw new Error(`Maximum stake is ${env.MAX_BET_STAKE} HTG`);
    }

    // 2. Daily stake limit
    const dailyKey = `risk:daily_stake:${userId}:${todayKey()}`;
    const dailyStakeRaw = await redis.get(dailyKey);
    const dailyStakeSoFar = dailyStakeRaw ? parseInt(dailyStakeRaw, 10) : 0;
    if (dailyStakeSoFar + stake > MAX_DAILY_STAKE_PER_USER) {
      throw new Error(
        `Daily stake limit of ${MAX_DAILY_STAKE_PER_USER} HTG reached. ` +
          `You have used ${dailyStakeSoFar} HTG today.`,
      );
    }

    // 3. Active bets count
    const activeBetsCount = await prisma.bet.count({
      where: { userId, status: 'PENDING' },
    });
    if (activeBetsCount >= MAX_ACTIVE_BETS) {
      throw new Error(
        `You have reached the maximum of ${MAX_ACTIVE_BETS} active bets. ` +
          `Please wait for some bets to settle before placing new ones.`,
      );
    }

    // 4. Per-market exposure check
    for (const sel of selections) {
      const market = await prisma.market.findUnique({ where: { id: sel.marketId } });
      if (!market) {
        throw new Error(`Market ${sel.marketId} not found`);
      }
      const currentExposure = parseFloat(market.totalExposure.toString());
      if (currentExposure + potentialWin > env.MAX_EXPOSURE_PER_MARKET) {
        throw new Error(
          `Market '${market.name}' has reached the maximum liability exposure of ` +
            `${env.MAX_EXPOSURE_PER_MARKET} HTG`,
        );
      }
    }

    // 5. Suspicious bet rate — more than RECENT_BET_RATE_LIMIT bets in last 60 seconds
    const rateKey = `risk:bet_count:${userId}`;
    const recentCount = await redis.get(rateKey);
    if (recentCount && parseInt(recentCount, 10) >= RECENT_BET_RATE_LIMIT) {
      await this.flagSuspiciousUser(userId, `Rapid betting: ${recentCount} bets in 60 seconds`);
      throw new Error('Slow down — too many bets placed in a short period. Please wait a moment.');
    }

    // Increment rate counter (expires after window)
    const newCount = await redis.incr(rateKey);
    if (newCount === 1) {
      await redis.expire(rateKey, RECENT_BET_WINDOW_SECONDS);
    }

    // Update daily stake in Redis (record the accepted stake)
    await redis.incrby(dailyKey, Math.round(stake));
    const ttl = await redis.ttl(dailyKey);
    if (ttl < 0) {
      await redis.expire(dailyKey, 86400);
    }
  }

  /**
   * Returns a risk profile snapshot for a user.
   */
  async getUserRiskProfile(userId: string): Promise<{
    dailyStake: number;
    activeBets: number;
    status: 'ok' | 'watch' | 'limit';
  }> {
    const dailyKey = `risk:daily_stake:${userId}:${todayKey()}`;
    const [dailyStakeRaw, activeBets] = await Promise.all([
      redis.get(dailyKey),
      prisma.bet.count({ where: { userId, status: 'PENDING' } }),
    ]);

    const dailyStake = dailyStakeRaw ? parseInt(dailyStakeRaw, 10) : 0;
    const ratio = dailyStake / MAX_DAILY_STAKE_PER_USER;

    let status: 'ok' | 'watch' | 'limit';
    if (ratio < 0.5) {
      status = 'ok';
    } else if (ratio < 0.9) {
      status = 'watch';
    } else {
      status = 'limit';
    }

    return { dailyStake, activeBets, status };
  }

  /**
   * Returns total pending exposure per outcome code for a given market.
   */
  async getMarketExposure(marketId: string): Promise<Record<string, number>> {
    const outcomes = await prisma.marketOutcome.findMany({
      where: { marketId },
      select: { code: true, id: true },
    });

    const result: Record<string, number> = {};

    await Promise.all(
      outcomes.map(async (outcome) => {
        const aggregate = await prisma.betSelection.aggregate({
          where: {
            marketId,
            outcomeId: outcome.id,
            bet: { status: 'PENDING' },
          },
          _sum: { oddsValue: true },
        });

        // Sum potentialWin contributions — each selection's oddsValue is the per-leg value.
        // To get actual exposure for this outcome, sum bet.potentialWin grouped by outcomeId.
        const rows = await prisma.betSelection.findMany({
          where: { marketId, outcomeId: outcome.id, bet: { status: 'PENDING' } },
          select: { bet: { select: { potentialWin: true } } },
        });

        const totalExposure = rows.reduce(
          (sum, row) => sum + parseFloat(row.bet.potentialWin.toString()),
          0,
        );

        result[outcome.code] = parseFloat(totalExposure.toFixed(2));
      }),
    );

    return result;
  }

  /**
   * Returns system-wide liability and the top 5 exposed markets.
   */
  async getSystemExposure(): Promise<{
    totalLiability: number;
    topMarkets: Array<{ marketId: string; exposure: number }>;
  }> {
    const aggregate = await prisma.bet.aggregate({
      where: { status: 'PENDING' },
      _sum: { potentialWin: true },
    });

    const totalLiability = parseFloat(
      (aggregate._sum.potentialWin ?? 0).toString(),
    );

    // Group by market via BetSelection to find per-market exposure
    const marketRows = await prisma.betSelection.groupBy({
      by: ['marketId'],
      where: { bet: { status: 'PENDING' } },
      _sum: { oddsValue: true },
    });

    // For each market, get actual potentialWin sum
    const marketExposures = await Promise.all(
      marketRows.map(async (row) => {
        const market = await prisma.market.findUnique({
          where: { id: row.marketId },
          select: { id: true, totalExposure: true },
        });
        return {
          marketId: row.marketId,
          exposure: market ? parseFloat(market.totalExposure.toString()) : 0,
        };
      }),
    );

    const topMarkets = marketExposures
      .sort((a, b) => b.exposure - a.exposure)
      .slice(0, 5);

    return { totalLiability, topMarkets };
  }

  /**
   * Creates an audit log entry and sets a Redis flag for a suspicious user.
   */
  async flagSuspiciousUser(userId: string, reason: string): Promise<void> {
    await Promise.all([
      prisma.auditLog.create({
        data: {
          userId,
          action: 'RISK_FLAG',
          entityType: 'User',
          entityId: userId,
          after: { reason, flaggedAt: new Date().toISOString() },
        },
      }),
      redis.set(`risk:flagged:${userId}`, reason, 'EX', 3600),
    ]);
  }

  /**
   * Checks whether a user is currently flagged as suspicious.
   */
  async isUserFlagged(userId: string): Promise<boolean> {
    const value = await redis.get(`risk:flagged:${userId}`);
    return value !== null;
  }
}

export const riskService = new RiskService();
