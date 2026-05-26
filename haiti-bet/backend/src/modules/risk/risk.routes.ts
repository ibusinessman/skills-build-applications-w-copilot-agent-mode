import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { riskService } from './risk.service';

const flagBodySchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export async function riskRoutes(fastify: FastifyInstance) {
  // GET /risk/profile/:userId — get risk profile for a user
  fastify.get(
    '/profile/:userId',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const profile = await riskService.getUserRiskProfile(userId);
      return reply.send({ data: profile });
    },
  );

  // GET /risk/exposure/market/:marketId — get per-outcome exposure for a market
  fastify.get(
    '/exposure/market/:marketId',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { marketId } = request.params as { marketId: string };
      const exposure = await riskService.getMarketExposure(marketId);
      return reply.send({ data: exposure });
    },
  );

  // GET /risk/exposure/system — get total system liability and top markets
  fastify.get(
    '/exposure/system',
    { preHandler: [fastify.requireAdmin] },
    async (_request, reply) => {
      const exposure = await riskService.getSystemExposure();
      return reply.send({ data: exposure });
    },
  );

  // POST /risk/flag/:userId — flag a user as suspicious
  fastify.post(
    '/flag/:userId',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const body = flagBodySchema.parse(request.body);
      await riskService.flagSuspiciousUser(userId, body.reason);
      return reply.send({ data: { flagged: true, userId } });
    },
  );

  // GET /risk/flagged/:userId — check whether a user is currently flagged
  fastify.get(
    '/flagged/:userId',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const flagged = await riskService.isUserFlagged(userId);
      return reply.send({ data: { userId, flagged } });
    },
  );
}
