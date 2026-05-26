import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { promotionsService } from './promotions.service';
import type { Promotion } from './promotions.service';

// ─── Response shape (hides internal / sensitive fields) ──────────────────────

interface PublicPromotion {
  id: string;
  code: string;
  type: Promotion['type'];
  value: number;
  minStake?: number;
  maxBonus?: number;
  validFrom: string;
  validUntil: string;
}

function toPublic(p: Promotion): PublicPromotion {
  return {
    id: p.id,
    code: p.code,
    type: p.type,
    value: p.value,
    minStake: p.minStake,
    maxBonus: p.maxBonus,
    validFrom: p.validFrom.toISOString(),
    validUntil: p.validUntil.toISOString(),
  };
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const applyBodySchema = z.object({
  code: z.string().min(1),
  context: z.object({
    stake: z.number().positive().optional(),
    depositAmount: z.number().positive().optional(),
  }),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function promotionsRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /active
   * Public — returns all currently active promotions with sensitive fields
   * stripped out.
   */
  fastify.get('/active', async (_request, reply) => {
    const promos = await promotionsService.getActivePromotions();
    const now = new Date();
    const active = promos
      .filter((p) => p.isActive && p.validFrom <= now && p.validUntil >= now)
      .map(toPublic);
    return reply.status(200).send({ promotions: active });
  });

  /**
   * POST /apply
   * Authenticated — apply a promo code in the context of a bet or deposit.
   * Body: { code: string; context: { stake?: number; depositAmount?: number } }
   */
  fastify.post(
    '/apply',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = applyBodySchema.parse(request.body);
      const result = await promotionsService.applyPromotion(
        body.code,
        request.user.sub,
        body.context,
      );
      return reply.status(200).send(result);
    },
  );
}
