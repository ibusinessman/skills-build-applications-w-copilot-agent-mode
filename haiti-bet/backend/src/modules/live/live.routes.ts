import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LiveService } from './live.service';

const liveService = new LiveService();

const liveEventSchema = z.object({
  eventType: z.enum(['GOAL', 'RED_CARD', 'YELLOW_CARD', 'PENALTY_AWARDED', 'VAR_CHECK', 'SUBSTITUTION']),
  minute: z.number().int().min(0),
  team: z.string(),
  player: z.string().optional(),
  description: z.string().optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(['SCHEDULED', 'LIVE', 'HALFTIME', 'FINISHED', 'POSTPONED', 'CANCELLED']),
  minute: z.number().int().optional(),
});

export async function liveRoutes(fastify: FastifyInstance) {
  // Admin: trigger a live event
  fastify.post(
    '/:matchId/event',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { matchId } = request.params as { matchId: string };
      const body = liveEventSchema.parse(request.body);
      await liveService.processLiveEvent({ matchId, ...body });
      return reply.send({ message: 'Live event processed and broadcast' });
    },
  );

  // Admin: update match status
  fastify.patch(
    '/:matchId/status',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { matchId } = request.params as { matchId: string };
      const body = statusUpdateSchema.parse(request.body);
      await liveService.updateMatchStatus(matchId, body.status, body.minute);
      return reply.send({ message: 'Status updated and broadcast' });
    },
  );
}
