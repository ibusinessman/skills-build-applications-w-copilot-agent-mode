import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { redis, KEYS } from '../../config/redis';
import { env } from '../../config/env';
import { createId } from '@paralleldrive/cuid2';

interface RegisterInput {
  phone: string;
  name: string;
  password?: string;
  email?: string;
}

interface LoginInput {
  phone: string;
  password: string;
}

interface VerifyOtpInput {
  phone: string;
  code: string;
  purpose?: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (existing) {
      throw new Error('Phone number already registered');
    }

    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : null;

    const user = await prisma.user.create({
      data: {
        phone: input.phone,
        name: input.name,
        email: input.email ?? null,
        passwordHash,
        status: 'PENDING_VERIFICATION',
      },
      select: { id: true, phone: true, name: true, status: true, createdAt: true },
    });

    await this.sendOtp(user.phone, 'registration');
    return user;
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (!user) throw new Error('Invalid credentials');
    if (user.status === 'SUSPENDED') throw new Error('Account suspended');

    if (user.passwordHash) {
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw new Error('Invalid credentials');
    }

    return user;
  }

  async sendOtp(phone: string, purpose = 'login'): Promise<void> {
    const attemptsKey = KEYS.otpAttempts(phone);
    const attempts = await redis.incr(attemptsKey);
    if (attempts === 1) await redis.expire(attemptsKey, 300);
    if (attempts > 5) throw new Error('Too many OTP requests. Try again in 5 minutes.');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000);

    await prisma.otpToken.create({
      data: { phone, code, purpose, expiresAt },
    });

    if (env.SMS_PROVIDER === 'console') {
      console.log(`[OTP] Phone: ${phone} | Code: ${code} | Purpose: ${purpose}`);
    } else {
      await this.sendSms(phone, `Haiti Bet - Kòd ou a: ${code}. Ekspire nan ${env.OTP_EXPIRES_MINUTES} minit.`);
    }
  }

  async verifyOtp(input: VerifyOtpInput): Promise<{ userId: string | null; verified: boolean }> {
    const token = await prisma.otpToken.findFirst({
      where: {
        phone: input.phone,
        code: input.code,
        purpose: input.purpose ?? 'login',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) {
      await prisma.otpToken.updateMany({
        where: { phone: input.phone, usedAt: null },
        data: { attempts: { increment: 1 } },
      });
      throw new Error('Invalid or expired OTP code');
    }

    await prisma.otpToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (user && user.status === 'PENDING_VERIFICATION') {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
      });
    }

    await redis.del(KEYS.otpAttempts(input.phone));

    return { userId: user?.id ?? null, verified: true };
  }

  async getUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        status: true,
        balance: true,
        isAdmin: true,
        createdAt: true,
      },
    });
  }

  private async sendSms(to: string, message: string): Promise<void> {
    if (env.SMS_PROVIDER === 'vonage' && env.VONAGE_API_KEY) {
      const { default: Vonage } = await import('@vonage/server-sdk' as any);
      const vonage = new Vonage({ apiKey: env.VONAGE_API_KEY!, apiSecret: env.VONAGE_API_SECRET! });
      await vonage.sms.send({ to, from: env.SMS_FROM, text: message });
    }
  }
}
