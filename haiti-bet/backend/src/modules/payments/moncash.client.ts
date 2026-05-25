import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { redis, KEYS } from '../../config/redis';

interface MoncashTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface MoncashPaymentResponse {
  payment_token: {
    token: string;
    created: string;
    expired: string;
  };
  timestamp: number;
  status: number;
}

interface MoncashTransactionDetails {
  transaction: {
    cost: number;
    transactionId: string;
    message: string;
    orderId: string;
    payer: string;
  };
  timestamp: number;
  status: number;
}

export class MoncashClient {
  private client: AxiosInstance;
  private readonly tokenCacheKey = 'moncash:access_token';

  constructor() {
    this.client = axios.create({
      baseURL: env.MONCASH_BASE_URL,
      timeout: 30000,
    });
  }

  private async getAccessToken(): Promise<string> {
    const cached = await redis.get(this.tokenCacheKey);
    if (cached) return cached;

    const credentials = Buffer.from(
      `${env.MONCASH_CLIENT_ID}:${env.MONCASH_CLIENT_SECRET}`,
    ).toString('base64');

    const response = await this.client.post<MoncashTokenResponse>(
      '/oauth/token?grant_type=client_credentials&scope=read,write',
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const { access_token, expires_in } = response.data;
    await redis.setex(this.tokenCacheKey, expires_in - 60, access_token);
    return access_token;
  }

  async createPayment(orderId: string, amount: number): Promise<MoncashPaymentResponse> {
    const token = await this.getAccessToken();

    const response = await this.client.post<MoncashPaymentResponse>(
      '/Api/v1/CreatePayment',
      { orderId, amount },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    // Cache token->orderId mapping for callback lookup
    await redis.setex(
      KEYS.moncashToken(response.data.payment_token.token),
      3600,
      orderId,
    );

    return response.data;
  }

  async getTransactionDetails(transactionId: string): Promise<MoncashTransactionDetails> {
    const token = await this.getAccessToken();

    const response = await this.client.post<MoncashTransactionDetails>(
      '/Api/v1/RetrieveTransactionPayment',
      { transactionId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    return response.data;
  }

  async getPaymentByOrderId(orderId: string): Promise<MoncashTransactionDetails> {
    const token = await this.getAccessToken();

    const response = await this.client.post<MoncashTransactionDetails>(
      '/Api/v1/RetrieveOrderPayment',
      { orderId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    return response.data;
  }

  getRedirectUrl(token: string): string {
    return `${env.MONCASH_BASE_URL}/Payment/Redirect?token=${token}`;
  }
}
