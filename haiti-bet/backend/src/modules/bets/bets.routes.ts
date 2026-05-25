import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { BetsService } from './bets.service';
import { createId } from '@paralleldrive/cuid2';

const betsService = new BetsService();

const placeBetSchema = z.object({
  stake: z.number().positive(),
  selections: z.array(
    z.object({
      marketId: z.string(),
      outcomeId: z.string(),
    }),
  ).min(1).max(8),
  idempotencyKey: z.string().optional(),
});

export async function betsRoutes(fastify: FastifyInstance) {
  // Place bet
  fastify.post(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = placeBetSchema.parse(request.body);
      const bet = await betsService.placeBet({
        userId: request.user.sub,
        stake: body.stake,
        selections: body.selections,
        idempotencyKey: body.idempotencyKey ?? createId(),
      });
      return reply.status(201).send({ data: bet });
    },
  );

  // List user bets
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { status } = request.query as { status?: string };
      const bets = await betsService.getUserBets(request.user.sub, status);
      return reply.send({ data: bets });
    },
  );

  // Get single bet
  fastify.get(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const bet = await betsService.getBetById(id, request.user.sub);
      if (!bet) return reply.status(404).send({ error: 'Bet not found' });
      return reply.send({ data: bet });
    },
  );
}
