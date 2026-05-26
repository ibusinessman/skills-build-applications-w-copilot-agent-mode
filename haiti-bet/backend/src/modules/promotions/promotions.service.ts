import { redis } from '../../config/redis';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Promotion {
  id: string;
  code: string;
  type: 'DEPOSIT_BONUS' | 'BET_BOOST' | 'FREE_BET';
  /** Percentage for DEPOSIT_BONUS / BET_BOOST; HTG amount for FREE_BET */
  value: number;
  minStake?: number;
  maxBonus?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

export interface ApplyPromoResult {
  bonus: number;
  promoId: string;
}

// ─── Redis keys ───────────────────────────────────────────────────────────────

const PROMO_CACHE_KEY = 'promos:active';
const PROMO_CACHE_TTL = 300; // 5 minutes

// ─── Default seed data ────────────────────────────────────────────────────────

const DEFAULT_PROMOS: Promotion[] = [
  {
    id: 'promo-001',
    code: 'BIENVENUE',
    type: 'DEPOSIT_BONUS',
    value: 50,
    maxBonus: 2500,
    minStake: 500,
    validFrom: new Date('2025-01-01T00:00:00Z'),
    validUntil: new Date('2026-12-31T23:59:59Z'),
    usageLimit: 1000,
    usageCount: 0,
    isActive: true,
  },
  {
    id: 'promo-002',
    code: 'GRENADIERS',
    type: 'BET_BOOST',
    value: 10,
    minStake: 100,
    validFrom: new Date('2025-01-01T00:00:00Z'),
    validUntil: new Date('2026-12-31T23:59:59Z'),
    usageLimit: 5000,
    usageCount: 0,
    isActive: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deserializePromos(raw: string): Promotion[] {
  const parsed = JSON.parse(raw) as Array<
    Omit<Promotion, 'validFrom' | 'validUntil'> & { validFrom: string; validUntil: string }
  >;
  return parsed.map((p) => ({
    ...p,
    validFrom: new Date(p.validFrom),
    validUntil: new Date(p.validUntil),
  }));
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class PromotionsService {
  /**
   * Return all active promotions.
   * Checks Redis cache first; returns an empty array on a cache miss (no DB
   * table in MVP yet — call seedDefaultPromos() to populate the cache).
   */
  async getActivePromotions(): Promise<Promotion[]> {
    const cached = await redis.get(PROMO_CACHE_KEY);
    if (!cached) {
      return [];
    }
    return deserializePromos(cached);
  }

  /**
   * Apply a promotion code and return the bonus amount.
   * Validates that the code exists, is active, within its validity window,
   * and has not exceeded its usage limit.
   */
  async applyPromotion(
    code: string,
    userId: string,
    context: { stake?: number; depositAmount?: number },
  ): Promise<ApplyPromoResult> {
    const promos = await this.getActivePromotions();

    const promo = promos.find(
      (p) => p.code.toUpperCase() === code.toUpperCase(),
    );

    if (!promo) {
      throw new Error(`Promotion code "${code}" not found`);
    }

    if (!promo.isActive) {
      throw new Error(`Promotion "${code}" is no longer active`);
    }

    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      throw new Error(`Promotion "${code}" is not valid at this time`);
    }

    if (promo.usageLimit !== undefined && promo.usageCount >= promo.usageLimit) {
      throw new Error(`Promotion "${code}" has reached its usage limit`);
    }

    // ── Bonus calculation ──────────────────────────────────────────────────
    let bonus = 0;

    if (promo.type === 'DEPOSIT_BONUS') {
      const deposit = context.depositAmount ?? 0;
      if (promo.minStake !== undefined && deposit < promo.minStake) {
        throw new Error(
          `Minimum deposit of ${promo.minStake} HTG required for this promotion`,
        );
      }
      bonus = (deposit * promo.value) / 100;
      if (promo.maxBonus !== undefined) {
        bonus = Math.min(bonus, promo.maxBonus);
      }
    } else if (promo.type === 'BET_BOOST') {
      const stake = context.stake ?? 0;
      if (promo.minStake !== undefined && stake < promo.minStake) {
        throw new Error(
          `Minimum stake of ${promo.minStake} HTG required for this promotion`,
        );
      }
      bonus = (stake * promo.value) / 100;
    } else if (promo.type === 'FREE_BET') {
      bonus = promo.value;
    }

    // ── Increment usageCount in Redis (best-effort; no DB in MVP) ─────────
    const updatedPromos = promos.map((p) =>
      p.id === promo.id ? { ...p, usageCount: p.usageCount + 1 } : p,
    );
    await redis.set(PROMO_CACHE_KEY, JSON.stringify(updatedPromos), 'EX', PROMO_CACHE_TTL);

    return { bonus, promoId: promo.id };
  }

  /**
   * Seed the Redis cache with the default promotions list.
   * TTL is 24 hours (86 400 s).  Call this on application startup or via an
   * admin endpoint to ensure the cache is populated.
   */
  async seedDefaultPromos(): Promise<void> {
    await redis.set(
      PROMO_CACHE_KEY,
      JSON.stringify(DEFAULT_PROMOS),
      'EX',
      86400,
    );
  }
}

export const promotionsService = new PromotionsService();
