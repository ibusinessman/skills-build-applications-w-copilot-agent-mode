import { prisma } from '../../config/database';
import { redis, KEYS } from '../../config/redis';
import { MoncashClient } from './moncash.client';
import { createId } from '@paralleldrive/cuid2';
import { env } from '../../config/env';

const moncash = new MoncashClient();

interface DepositInput {
  userId: string;
  amount: number;
  idempotencyKey?: string;
}

interface WithdrawInput {
  userId: string;
  amount: number;
  phone: string;
  idempotencyKey?: string;
}

export class PaymentsService {
  async initiateDeposit(input: DepositInput) {
    const { userId, amount } = input;
    const idempotencyKey = input.idempotencyKey ?? createId();

    if (amount < 100) throw new Error('Minimum deposit is 100 HTG');
    if (amount > 500000) throw new Error('Maximum deposit is 500,000 HTG');

    // Check for existing pending deposit with same key
    const existing = await prisma.transaction.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;

    const orderId = `DEP-${Date.now()}-${userId.slice(-6)}`;

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        amount,
        status: 'PENDING',
        moncashOrderId: orderId,
        idempotencyKey,
      },
    });

    const payment = await moncash.createPayment(orderId, amount);
    const redirectUrl = moncash.getRedirectUrl(payment.payment_token.token);

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { moncashToken: payment.payment_token.token },
    });

    return { transaction, redirectUrl, token: payment.payment_token.token };
  }

  async confirmDeposit(transactionId: string, moncashTransactionId?: string): Promise<void> {
    // Idempotency: check if already processed
    const callbackExists = await prisma.moncashCallback.findUnique({ where: { transactionId } });
    if (callbackExists) return;

    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction || transaction.status !== 'PENDING') return;
    if (transaction.type !== 'DEPOSIT') return;

    // Verify with MonCash
    let verified = false;
    if (transaction.moncashOrderId) {
      try {
        const details = await moncash.getPaymentByOrderId(transaction.moncashOrderId);
        if (details.transaction?.cost === parseFloat(transaction.amount.toString())) {
          verified = true;
        }
      } catch {
        verified = false;
      }
    }

    if (!verified && env.NODE_ENV === 'development') {
      verified = true; // Allow sandbox mode without real verification
    }

    if (!verified) throw new Error('Payment verification failed');

    await prisma.$transaction(async (tx) => {
      // Lock callback dedup record first
      await tx.moncashCallback.create({
        data: {
          transactionId,
          orderId: transaction.moncashOrderId ?? '',
          rawPayload: { transactionId: moncashTransactionId, verified: true },
        },
      });

      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'COMPLETED', reference: moncashTransactionId },
      });

      await tx.user.update({
        where: { id: transaction.userId },
        data: { balance: { increment: transaction.amount } },
      });
    });
  }

  async initiateWithdrawal(input: WithdrawInput) {
    const { userId, amount, phone } = input;
    const idempotencyKey = input.idempotencyKey ?? createId();

    if (amount < 100) throw new Error('Minimum withdrawal is 100 HTG');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (parseFloat(user.balance.toString()) < amount) throw new Error('Insufficient balance');

    const existing = await prisma.transaction.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          amount,
          status: 'PENDING',
          idempotencyKey,
          metadata: { phone },
        },
      });
    });

    // In production: trigger actual MonCash transfer API
    // For now: mark as pending for admin approval
    return transaction;
  }

  async getUserTransactions(userId: string) {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    return parseFloat(user?.balance.toString() ?? '0');
  }

  async handleMoncashCallback(payload: any): Promise<void> {
    const { transactionId, orderId } = payload;

    // Find transaction by MonCash order ID
    const transaction = await prisma.transaction.findFirst({
      where: { moncashOrderId: orderId },
    });

    if (!transaction) return;
    await this.confirmDeposit(transaction.id, transactionId);
  }
}
