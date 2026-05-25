import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PaymentsService } from './payments.service';

const paymentsService = new PaymentsService();

const depositSchema = z.object({
  amount: z.number().positive(),
  idempotencyKey: z.string().optional(),
});

const withdrawSchema = z.object({
  amount: z.number().positive(),
  phone: z.string(),
  idempotencyKey: z.string().optional(),
});

export async function paymentsRoutes(fastify: FastifyInstance) {
  // Initiate deposit via MonCash
  fastify.post(
    '/deposit',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = depositSchema.parse(request.body);
      const result = await paymentsService.initiateDeposit({
        userId: request.user.sub,
        amount: body.amount,
        idempotencyKey: body.idempotencyKey,
      });
      return reply.status(201).send({ data: result });
    },
  );

  // Confirm deposit (called after MonCash redirect)
  fastify.post(
    '/deposit/:transactionId/confirm',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { transactionId } = request.params as { transactionId: string };
      const { moncashTransactionId } = (request.body ?? {}) as { moncashTransactionId?: string };
      await paymentsService.confirmDeposit(transactionId, moncashTransactionId);
      return reply.send({ message: 'Deposit confirmed' });
    },
  );

  // MonCash webhook callback (no auth - verified by payload)
  fastify.post('/moncash/callback', async (request, reply) => {
    await paymentsService.handleMoncashCallback(request.body);
    return reply.send({ status: 'ok' });
  });

  // Initiate withdrawal
  fastify.post(
    '/withdraw',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = withdrawSchema.parse(request.body);
      const transaction = await paymentsService.initiateWithdrawal({
        userId: request.user.sub,
        ...body,
      });
      return reply.status(201).send({ data: transaction });
    },
  );

  // Get user wallet balance
  fastify.get(
    '/balance',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const balance = await paymentsService.getBalance(request.user.sub);
      return reply.send({ data: { balance } });
    },
  );

  // Get transaction history
  fastify.get(
    '/transactions',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const transactions = await paymentsService.getUserTransactions(request.user.sub);
      return reply.send({ data: transactions });
    },
  );
}
