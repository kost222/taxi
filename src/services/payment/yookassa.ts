import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';
const SHOP_ID = process.env.YOOKASSA_SHOP_ID || '';
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const RETURN_URL = process.env.RETURN_URL || '';

interface PaymentAmount {
  value: string;
  currency: string;
}

interface CreatePaymentParams {
  amount: number;
  currency?: string;
  description: string;
  userId: string;
  orderId?: string;
  isSubscription?: boolean;
  savePaymentMethod?: boolean;
}

interface PaymentResponse {
  paymentId: string;
  status: string;
  confirmationUrl?: string;
  amount: string;
  currency: string;
  createdAt: string;
  metadata: any;
}

interface WebhookData {
  event: string;
  object: {
    id: string;
    status: string;
    amount: PaymentAmount;
    metadata: any;
  };
}

const authHeader = {
  auth: {
    username: SHOP_ID,
    password: SECRET_KEY
  }
};

export async function createPayment({
  amount,
  currency = 'RUB',
  description,
  userId,
  orderId,
  isSubscription = false,
  savePaymentMethod = false
}: CreatePaymentParams): Promise<PaymentResponse> {
  try {
    const idempotencyKey = uuidv4();

    const paymentData = {
      amount: {
        value: amount.toFixed(2),
        currency
      },
      confirmation: {
        type: 'redirect',
        return_url: RETURN_URL
      },
      description,
      metadata: {
        userId,
        orderId,
        timestamp: new Date().toISOString()
      },
      save_payment_method: savePaymentMethod || isSubscription,
      capture: true
    };

    const response = await axios.post(
      `${YOOKASSA_API_URL}/payments`,
      paymentData,
      {
        ...authHeader,
        headers: {
          'Idempotence-Key': idempotencyKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      paymentId: response.data.id,
      status: response.data.status,
      confirmationUrl: response.data.confirmation?.confirmation_url,
      amount: response.data.amount.value,
      currency: response.data.amount.currency,
      createdAt: response.data.created_at,
      metadata: response.data.metadata
    };
  } catch (error: any) {
    console.error('YooKassa API error:', error.response?.data || error.message);
    throw new Error('Failed to create payment');
  }
}

export async function handleWebhook(webhookData: WebhookData) {
  try {
    const { event, object } = webhookData;

    if (event === 'payment.succeeded' || event === 'payment.canceled') {
      return {
        paymentId: object.id,
        status: object.status,
        amount: object.amount.value,
        currency: object.amount.currency,
        metadata: object.metadata
      };
    }

    return { status: 'ignored', event };
  } catch (error) {
    console.error('Webhook processing error:', error);
    throw error;
  }
}

export async function getPaymentStatus(paymentId: string) {
  try {
    const response = await axios.get(
      `${YOOKASSA_API_URL}/payments/${paymentId}`,
      authHeader
    );

    return {
      paymentId: response.data.id,
      status: response.data.status,
      amount: response.data.amount.value,
      currency: response.data.amount.currency,
      paid: response.data.paid,
      createdAt: response.data.created_at,
      metadata: response.data.metadata
    };
  } catch (error: any) {
    console.error('Error getting payment status:', error.response?.data || error.message);
    throw new Error('Failed to get payment status');
  }
}

export async function createRefund({ paymentId, amount }: { paymentId: string; amount: number }) {
  try {
    const idempotencyKey = uuidv4();

    const refundData = {
      payment_id: paymentId,
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      }
    };

    const response = await axios.post(
      `${YOOKASSA_API_URL}/refunds`,
      refundData,
      {
        ...authHeader,
        headers: {
          'Idempotence-Key': idempotencyKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      refundId: response.data.id,
      status: response.data.status,
      amount: response.data.amount.value,
      currency: response.data.amount.currency,
      createdAt: response.data.created_at
    };
  } catch (error: any) {
    console.error('Error creating refund:', error.response?.data || error.message);
    throw new Error('Failed to create refund');
  }
}

export async function chargeSavedCard({
  userId,
  amount,
  currency = 'RUB',
  description,
  orderId
}: CreatePaymentParams) {
  try {
    // This would typically look up the saved payment method for the user
    // For demo purposes, we'll create a new payment
    return createPayment({
      amount,
      currency,
      description,
      userId,
      orderId,
      savePaymentMethod: false
    });
  } catch (error) {
    console.error('Error charging saved card:', error);
    throw error;
  }
}