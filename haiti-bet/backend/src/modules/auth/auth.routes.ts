import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from './auth.service';

const authService = new AuthService();

const registerSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number'),
  name: z.string().min(2).max(100),
  password: z.string().min(6).optional(),
  email: z.string().email().optional(),
});

const loginSchema = z.object({
  phone: z.string(),
  password: z.string(),
});

const otpRequestSchema = z.object({
  phone: z.string(),
  purpose: z.enum(['login', 'registration', 'withdrawal']).default('login'),
});

const otpVerifySchema = z.object({
  phone: z.string(),
  code: z.string().length(6),
  purpose: z.string().optional(),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const user = await authService.register(body);
    return reply.status(201).send({ data: user, message: 'OTP sent to your phone' });
  });

  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await authService.login(body);
    const token = fastify.jwt.sign({
      sub: user.id,
      phone: user.phone,
      isAdmin: user.isAdmin,
    });
    return reply.send({ data: { token, user: { id: user.id, phone: user.phone, name: user.name, isAdmin: user.isAdmin } } });
  });

  fastify.post('/otp/send', async (request, reply) => {
    const body = otpRequestSchema.parse(request.body);
    await authService.sendOtp(body.phone, body.purpose);
    return reply.send({ message: 'OTP sent successfully' });
  });

  fastify.post('/otp/verify', async (request, reply) => {
    const body = otpVerifySchema.parse(request.body);
    const result = await authService.verifyOtp(body);

    if (result.userId) {
      const user = await authService.getUser(result.userId);
      const token = fastify.jwt.sign({
        sub: result.userId,
        phone: body.phone,
        isAdmin: user?.isAdmin ?? false,
      });
      return reply.send({ data: { token, user, verified: true } });
    }

    return reply.send({ data: { verified: true } });
  });

  fastify.get(
    '/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await authService.getUser(request.user.sub);
      if (!user) return reply.status(404).send({ error: 'User not found' });
      return reply.send({ data: user });
    },
  );
}
