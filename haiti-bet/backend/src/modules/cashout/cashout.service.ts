import { prisma } from '../../config/database';
import { redis, KEYS } from '../../config/redis';
import { env } from '../../config/env';
import { calculatePotentialWin } from '../../utils/odds.utils';

const CASHOUT_MARGIN_DEFAULT = 0.05;
const QUOTE_TTL_SECONDS = 30;
const PRICE_MOVEMENT_TOLERANCE = 0.02; // 2%

export interface CashOutQuote {
  betId: string;
  originalStake: number;
  originalPotentialWin: number;
  currentOdds: number[];
  fairValue: number;
  cashOutValue: number;
  margin: number;
  expiresAt: Date;
}

export class CashOutService {
  private get cashOutMargin(): number {
    return (env as Record<string, unknown>)['CASHOUT_MARGIN'] !== undefined
      ? Number((env as Record<string, unknown>)['CASHOUT_MARGIN'])
      : CASHOUT_MARGIN_DEFAULT;
  }

  /**
   * Calculates a live cash-out quote for a pending bet.
   * The quote is cached in Redis for 30 seconds.
   */
  async getQuote(betId: string, userId: string): Promise<CashOutQuote> {
    const bet = await prisma.bet.findFirst({
      where: { id: betId, userId },
      include: {
        selections: {
          include: {
            market: { select: { id: true, status: true } },
            outcome: {
              select: {
                id: true,
                code: true,
                odds: { where: { isActive: true }, orderBy: { version: 'desc' }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!bet) {
      throw new Error('Bet not found');
    }
    if (bet.status !== 'PENDING') {
      throw new Error(`Bet is not eligible for cash out — status is ${bet.status}`);
    }

    const originalStake = parseFloat(bet.totalStake.toString());
    const originalPotentialWin = parseFloat(bet.potentialWin.toString());

    // Resolve current odds for each selection (Redis first, DB fallback)
    const currentOdds: number[] = [];
    for (const sel of bet.selections) {
      const redisKey = KEYS.currentOdds(sel.outcome.id);
      const cached = await redis.get(redisKey);

      if (cached !== null) {
        currentOdds.push(parseFloat(cached));
      } else if (sel.outcome.odds.length > 0) {
        currentOdds.push(parseFloat(sel.outcome.odds[0].value.toString()));
      } else {
        // Fall back to the odds recorded at bet placement time
        currentOdds.push(parseFloat(sel.oddsValue.toString()));
      }
    }

    // currentPotentialWin = what the bet would pay at today's odds
    const currentPotentialWin = calculatePotentialWin(originalStake, currentOdds);

    // fairValue is the proportional share of stake relative to how the combined odds have moved
    const oddsRatio = originalPotentialWin > 0 ? currentPotentialWin / originalPotentialWin : 0;
    const fairValue = parseFloat((originalStake * oddsRatio).toFixed(2));

    // Apply bookmaker margin on top
    const margin = this.cashOutMargin;
    const cashOutValue = Math.floor(fairValue * (1 - margin) * 100) / 100;

    const expiresAt = new Date(Date.now() + QUOTE_TTL_SECONDS * 1000);

    const quote: CashOutQuote = {
      betId,
      originalStake,
      originalPotentialWin,
      currentOdds,
      fairValue,
      cashOutValue,
      margin,
      expiresAt,
    };

    // Cache in Redis — downstream executeCashOut reads this to validate acceptedValue
    await redis.set(
      `cashout:quote:${betId}`,
      JSON.stringify(quote),
      'EX',
      QUOTE_TTL_SECONDS,
    );

    return quote;
  }

  /**
   * Executes a cash-out based on a previously generated quote.
   * Validates the accepted value against the cached quote within a 2% tolerance.
   */
  async executeCashOut(
    betId: string,
    userId: string,
    acceptedValue: number,
  ): Promise<{ success: boolean; paidOut: number }> {
    const quoteKey = `cashout:quote:${betId}`;
    const lockKey = `cashout:lock:${betId}`;

    // Read cached quote
    const cachedRaw = await redis.get(quoteKey);
    if (!cachedRaw) {
      throw new Error('Quote expired — please refresh the cash-out offer first');
    }

    const cachedQuote: CashOutQuote = JSON.parse(cachedRaw);
    const cashOutValue = cachedQuote.cashOutValue;

    // Validate accepted value is within tolerance of cached value
    const diff = Math.abs(acceptedValue - cashOutValue) / cashOutValue;
    if (diff > PRICE_MOVEMENT_TOLERANCE) {
      throw new Error(
        `Accepted value ${acceptedValue} differs by more than ${PRICE_MOVEMENT_TOLERANCE * 100}% ` +
          `from the current offer of ${cashOutValue}. Please refresh the quote.`,
      );
    }

    // Set a processing lock to prevent duplicate execution
    const locked = await redis.set(lockKey, '1', 'EX', 30, 'NX');
    if (!locked) {
      throw new Error('A cash-out for this bet is already being processed');
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Re-fetch bet inside transaction to ensure it is still PENDING
        const bet = await tx.bet.findFirst({
          where: { id: betId, userId },
          select: { id: true, status: true, potentialWin: true, selections: { select: { marketId: true } } },
        });

        if (!bet) throw new Error('Bet not found');
        if (bet.status !== 'PENDING') {
          throw new Error(`Bet can no longer be cashed out — status is ${bet.status}`);
        }

        const originalPotentialWin = parseFloat(bet.potentialWin.toString());

        // Settle the bet as CANCELLED
        await tx.bet.update({
          where: { id: betId },
          data: { status: 'CANCELLED', settledAt: new Date() },
        });

        // Credit the user with the cash-out value
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: cashOutValue } },
        });

        // Record the payout as a BET_REFUND transaction
        await tx.transaction.create({
          data: {
            userId,
            type: 'BET_REFUND',
            amount: cashOutValue,
            status: 'COMPLETED',
            idempotencyKey: `cashout-${betId}`,
            reference: `Cash out for bet ${betId}`,
          },
        });

        // Reduce totalExposure on every market that was part of this bet
        const marketIds = [...new Set(bet.selections.map((s) => s.marketId))];
        for (const marketId of marketIds) {
          await tx.market.update({
            where: { id: marketId },
            data: { totalExposure: { decrement: originalPotentialWin } },
          });
        }
      });
    } finally {
      // Always release the lock and invalidate the quote
      await Promise.all([redis.del(lockKey), redis.del(quoteKey)]);
    }

    return { success: true, paidOut: cashOutValue };
  }

  /**
   * Checks whether a bet is currently eligible for cash out.
   */
  async isEligible(
    betId: string,
  ): Promise<{ eligible: boolean; reason?: string }> {
    // Check for an in-progress execution lock
    const lockKey = `cashout:lock:${betId}`;
    const locked = await redis.get(lockKey);
    if (locked) {
      return { eligible: false, reason: 'Cash out already in progress for this bet' };
    }

    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: {
        selections: {
          include: {
            market: { select: { id: true, status: true, name: true } },
          },
        },
      },
    });

    if (!bet) {
      return { eligible: false, reason: 'Bet not found' };
    }

    if (bet.status !== 'PENDING') {
      return { eligible: false, reason: `Bet is ${bet.status} and cannot be cashed out` };
    }

    // All selected markets must be OPEN
    for (const sel of bet.selections) {
      const { status, name } = sel.market;
      if (status !== 'OPEN') {
        return {
          eligible: false,
          reason: `Market '${name}' is ${status} — cash out is not available while markets are suspended or settled`,
        };
      }
    }

    return { eligible: true };
  }
}

export const cashOutService = new CashOutService();
