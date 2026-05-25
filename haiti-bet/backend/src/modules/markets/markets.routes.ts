import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MarketsService } from './markets.service';

const marketsService = new MarketsService();

const createMarketSchema = z.object({
  matchId: z.string(),
  name: z.string().min(2),
  category: z.enum(['MATCH_RESULT', 'GOALS', 'HANDICAP', 'PLAYER', 'LIVE', 'SPECIAL']),
  isLive: z.boolean().optional(),
  outcomes: z.array(
    z.object({
      name: z.string(),
      code: z.string(),
      initialProbability: z.number().min(0.01).max(0.99),
    }),
  ).min(2),
});

const settleSchema = z.object({
  winningOutcomeCode: z.string(),
});

export async function marketsRoutes(fastify: FastifyInstance) {
  // Public: list markets for a match
  fastify.get('/match/:matchId', async (request, reply) => {
    const { matchId } = request.params as { matchId: string };
    const { category } = request.query as { category?: string };
    const markets = await marketsService.getMarketsForMatch(matchId, category);
    return reply.send({ data: markets });
  });

  // Public: get single market
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const market = await marketsService.getMarketWithOdds(id);
    if (!market) return reply.status(404).send({ error: 'Market not found' });
    return reply.send({ data: market });
  });

  // Admin: create market
  fastify.post(
    '/',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const body = createMarketSchema.parse(request.body);
      const market = await marketsService.createMarket(body);
      return reply.status(201).send({ data: market });
    },
  );

  // Admin: suspend/open market
  fastify.patch(
    '/:id/status',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: 'OPEN' | 'SUSPENDED' | 'CLOSED' };
      const market = await marketsService.setMarketStatus(id, status);
      return reply.send({ data: market });
    },
  );

  // Admin: settle market
  fastify.post(
    '/:id/settle',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = settleSchema.parse(request.body);
      const result = await marketsService.settleMarket(id, body.winningOutcomeCode);
      return reply.send({ data: result, message: 'Market settled. Settlement job queued.' });
    },
  );

  // Admin: get market exposure
  fastify.get(
    '/:id/exposure',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const exposure = await marketsService.getExposure(id);
      return reply.send({ data: exposure });
    },
  );
}
