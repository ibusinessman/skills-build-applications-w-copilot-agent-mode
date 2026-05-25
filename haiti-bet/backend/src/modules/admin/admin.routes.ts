import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { BetsService } from '../bets/bets.service';
import { MarketsService } from '../markets/markets.service';
import { env } from '../../config/env';
import bcrypt from 'bcryptjs';

const betsService = new BetsService();
const marketsService = new MarketsService();

export async function adminRoutes(fastify: FastifyInstance) {
  // Bootstrap first admin (secret key required)
  fastify.post('/bootstrap', async (request, reply) => {
    const { secret, phone, name, password } = request.body as any;
    if (secret !== env.ADMIN_SECRET) {
      return reply.status(403).send({ error: 'Invalid admin secret' });
    }

    const existing = await prisma.user.findFirst({ where: { isAdmin: true } });
    if (existing) {
      return reply.status(409).send({ error: 'Admin already exists' });
    }

    const admin = await prisma.user.create({
      data: {
        phone,
        name,
        passwordHash: await bcrypt.hash(password, 12),
        status: 'ACTIVE',
        isAdmin: true,
      },
      select: { id: true, phone: true, name: true, isAdmin: true },
    });

    return reply.status(201).send({ data: admin });
  });

  // Dashboard stats
  fastify.get(
    '/stats',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const [users, bets, pendingWithdrawals, totalDeposited] = await Promise.all([
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.bet.groupBy({ by: ['status'], _count: true }),
        prisma.transaction.count({ where: { type: 'WITHDRAWAL', status: 'PENDING' } }),
        prisma.transaction.aggregate({
          where: { type: 'DEPOSIT', status: 'COMPLETED' },
          _sum: { amount: true },
        }),
      ]);

      return reply.send({
        data: {
          activeUsers: users,
          bets: Object.fromEntries(bets.map((b) => [b.status, b._count])),
          pendingWithdrawals,
          totalDeposited: totalDeposited._sum.amount ?? 0,
        },
      });
    },
  );

  // List all users
  fastify.get(
    '/users',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { page = '1', limit = '50', status } = request.query as any;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: status ? { status } : {},
          select: {
            id: true, phone: true, name: true, email: true,
            status: true, balance: true, isAdmin: true, createdAt: true,
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
      ]);

      return reply.send({ data: users, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
    },
  );

  // Suspend/activate user
  fastify.patch(
    '/users/:id/status',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: 'ACTIVE' | 'SUSPENDED' };

      const user = await prisma.user.update({
        where: { id },
        data: { status },
        select: { id: true, phone: true, status: true },
      });

      return reply.send({ data: user });
    },
  );

  // List pending withdrawals
  fastify.get(
    '/withdrawals/pending',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const withdrawals = await prisma.transaction.findMany({
        where: { type: 'WITHDRAWAL', status: 'PENDING' },
        include: { user: { select: { id: true, phone: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      });
      return reply.send({ data: withdrawals });
    },
  );

  // Approve/reject withdrawal
  fastify.patch(
    '/withdrawals/:id',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { action } = request.body as { action: 'approve' | 'reject' };

      const tx = await prisma.transaction.findUnique({ where: { id } });
      if (!tx) return reply.status(404).send({ error: 'Transaction not found' });
      if (tx.status !== 'PENDING') return reply.status(400).send({ error: 'Already processed' });

      if (action === 'approve') {
        await prisma.transaction.update({ where: { id }, data: { status: 'COMPLETED' } });
      } else {
        await prisma.$transaction(async (prismaT) => {
          await prismaT.transaction.update({ where: { id }, data: { status: 'CANCELLED' } });
          await prismaT.user.update({
            where: { id: tx.userId },
            data: { balance: { increment: tx.amount } },
          });
        });
      }

      return reply.send({ message: `Withdrawal ${action}d` });
    },
  );

  // Audit log
  fastify.get(
    '/audit',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { page = '1', limit = '100' } = request.query as any;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const logs = await prisma.auditLog.findMany({
        include: { user: { select: { id: true, phone: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      });

      return reply.send({ data: logs });
    },
  );

  // Settle market from admin
  fastify.post(
    '/markets/:id/settle',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { winningOutcomeCode } = request.body as { winningOutcomeCode: string };

      const result = await marketsService.settleMarket(id, winningOutcomeCode);
      await betsService.settleBetsForMarket(id, winningOutcomeCode);

      return reply.send({ data: result });
    },
  );
}
