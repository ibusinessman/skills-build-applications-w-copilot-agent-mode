import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { prisma } from '../config/database';

const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const SKIP_PATHS = ['/health', '/docs', '/ws'];

export const auditPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!AUDITED_METHODS.includes(request.method)) return;
    if (SKIP_PATHS.some((p) => request.url.startsWith(p))) return;
    if (reply.statusCode >= 500) return;

    const userId = (request.user as any)?.sub ?? null;
    const action = `${request.method} ${request.routerPath ?? request.url}`;

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']?.slice(0, 200),
          after: request.body ? (request.body as object) : undefined,
        },
      });
    } catch {
      // audit failure must never break the request
    }
  });
});
