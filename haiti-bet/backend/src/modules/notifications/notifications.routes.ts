import { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database';

export async function notificationsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const notifications = await prisma.notification.findMany({
        where: { userId: request.user.sub },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      return reply.send({ data: notifications });
    },
  );

  fastify.patch(
    '/:id/read',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await prisma.notification.updateMany({
        where: { id, userId: request.user.sub },
        data: { isRead: true },
      });
      return reply.send({ message: 'Marked as read' });
    },
  );

  fastify.post(
    '/read-all',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      await prisma.notification.updateMany({
        where: { userId: request.user.sub, isRead: false },
        data: { isRead: true },
      });
      return reply.send({ message: 'All marked as read' });
    },
  );
}
