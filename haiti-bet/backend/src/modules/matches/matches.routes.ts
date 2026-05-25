import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MatchesService } from './matches.service';

const matchesService = new MatchesService();

const createMatchSchema = z.object({
  homeTeam: z.string().min(2),
  awayTeam: z.string().min(2),
  competition: z.string().min(2),
  venue: z.string().optional(),
  scheduledAt: z.string().datetime(),
});

const liveUpdateSchema = z.object({
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  minute: z.number().int().min(0).max(120).optional(),
  period: z.enum(['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME', 'PENALTIES']).optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'HALFTIME', 'FINISHED', 'POSTPONED', 'CANCELLED']).optional(),
});

const addEventSchema = z.object({
  type: z.enum(['GOAL', 'RED_CARD', 'YELLOW_CARD', 'PENALTY_AWARDED', 'VAR_CHECK', 'SUBSTITUTION']),
  minute: z.number().int().min(0),
  team: z.string(),
  player: z.string().optional(),
  description: z.string().optional(),
});

export async function matchesRoutes(fastify: FastifyInstance) {
  // Public: list matches
  fastify.get('/', async (request, reply) => {
    const query = request.query as { status?: string; upcoming?: string };
    const matches = await matchesService.list({
      status: query.status as any,
      upcoming: query.upcoming === 'true',
    });
    return reply.send({ data: matches });
  });

  // Public: get match by id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const match = await matchesService.getById(id);
    if (!match) return reply.status(404).send({ error: 'Match not found' });
    return reply.send({ data: match });
  });

  // Public: get live state only (low-latency)
  fastify.get('/:id/live', async (request, reply) => {
    const { id } = request.params as { id: string };
    const state = await matchesService.getLiveState(id);
    return reply.send({ data: state });
  });

  // Admin: create match
  fastify.post(
    '/',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const body = createMatchSchema.parse(request.body);
      const match = await matchesService.create({ ...body, scheduledAt: new Date(body.scheduledAt) });
      return reply.status(201).send({ data: match });
    },
  );

  // Admin: update live state
  fastify.patch(
    '/:id/live',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = liveUpdateSchema.parse(request.body);
      const match = await matchesService.updateLive({ matchId: id, ...body });
      return reply.send({ data: match });
    },
  );

  // Admin: add match event
  fastify.post(
    '/:id/events',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = addEventSchema.parse(request.body);
      const event = await matchesService.addEvent(id, body);
      return reply.status(201).send({ data: event });
    },
  );
}
