import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { cashOutService } from './cashout.service';

const executeBodySchema = z.object({
  acceptedValue: z.number().positive('Accepted value must be a positive number'),
});

export async function cashoutRoutes(fastify: FastifyInstance) {
  // GET /cashout/quote/:betId — retrieve a 30-second cash-out offer for a pending bet
  fastify.get(
    '/quote/:betId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { betId } = request.params as { betId: string };
      const userId = request.user.sub;
      const quote = await cashOutService.getQuote(betId, userId);
      return reply.send({ data: quote });
    },
  );

  // POST /cashout/execute/:betId — accept and execute a cash-out offer
  fastify.post(
    '/execute/:betId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { betId } = request.params as { betId: string };
      const userId = request.user.sub;
      const body = executeBodySchema.parse(request.body);
      const result = await cashOutService.executeCashOut(betId, userId, body.acceptedValue);
      return reply.send({ data: result });
    },
  );

  // GET /cashout/eligible/:betId — check whether a bet is eligible for cash out
  fastify.get(
    '/eligible/:betId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { betId } = request.params as { betId: string };
      const eligibility = await cashOutService.isEligible(betId);
      return reply.send({ data: eligibility });
    },
  );
}
