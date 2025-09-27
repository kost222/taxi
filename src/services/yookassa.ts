// Task 20: YooKassa Payment Integration Service
import axios from 'axios'
interface IYooKassaConfig {
  shopId: string
  secretKey: string
  returnUrl?: string
  environment?: 'production' | 'test'
}
interface IPaymentData {
  amount: {
    value: string
    currency: 'RUB' | 'USD' | 'EUR'
  }
  description: string
  metadata?: Record<string, any>
  receipt?: IReceipt
  capture?: boolean
  payment_method_data?: {
    type: string
  }
  confirmation?: {
    type: 'redirect' | 'embedded'
    return_url?: string
    confirmation_url?: string
  }
}
interface IReceipt {
  customer: {
    email?: string
    phone?: string
  }
  items: IReceiptItem[]
}
interface IReceiptItem {
  description: string
  quantity: number
  amount: {
    value: string
    currency: string
  }
  vat_code: number
  payment_subject?: string
  payment_mode?: string
}
interface IPaymentResponse {
  id: string
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled'
  amount: {
    value: string
    currency: string
  }
  description?: string
  recipient?: {
    account_id: string
    gateway_id: string
  }
  payment_method?: {
    type: string
    id: string
    saved: boolean
    title?: string
  }
  created_at: string
  expires_at?: string
  confirmation?: {
    type: string
    confirmation_url?: string
  }
  test: boolean
  paid: boolean
  refundable: boolean
  metadata?: Record<string, any>
}
interface IRefundData {
  payment_id: string
  amount: {
    value: string
    currency: string
  }
  description?: string
}
interface ISubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: 'RUB'
  period: 'monthly' | 'yearly'
  features: string[]
}
class YooKassaService {
  private config: IYooKassaConfig
  private apiUrl: string
  private authHeader: string
  constructor(config: IYooKassaConfig) {
    this.config = config
    this.apiUrl = config.environment === 'test'
      ? 'https://api.yookassa.ru/v3'
      : 'https://api.yookassa.ru/v3'
    // Create Basic Auth header
    const credentials = Buffer.from(`${config.shopId}:${config.secretKey}`).toString('base64')
    this.authHeader = `Basic ${credentials}`
  }
  /**
   * Create a payment
   */
  async createPayment(data: IPaymentData): Promise<IPaymentResponse> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/payments`,
        {
          ...data,
          confirmation: data.confirmation || {
            type: 'redirect',
            return_url: this.config.returnUrl || window.location.origin + '/payment/success'
          }
        },
        {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
            'Idempotence-Key': this.generateIdempotenceKey()
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.description || 'Payment creation failed')
    }
  }
  /**
   * Get payment info
   */
  async getPayment(paymentId: string): Promise<IPaymentResponse> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/payments/${paymentId}`,
        {
          headers: {
            'Authorization': this.authHeader
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error('Failed to get payment info')
    }
  }
  /**
   * Capture payment (for two-stage payments)
   */
  async capturePayment(paymentId: string, amount?: { value: string, currency: string }): Promise<IPaymentResponse> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/payments/${paymentId}/capture`,
        amount ? { amount } : {},
        {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
            'Idempotence-Key': this.generateIdempotenceKey()
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error('Failed to capture payment')
    }
  }
  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string): Promise<IPaymentResponse> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/payments/${paymentId}/cancel`,
        {},
        {
          headers: {
            'Authorization': this.authHeader,
            'Idempotence-Key': this.generateIdempotenceKey()
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error('Failed to cancel payment')
    }
  }
  /**
   * Create refund
   */
  async createRefund(data: IRefundData): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/refunds`,
        data,
        {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
            'Idempotence-Key': this.generateIdempotenceKey()
          }
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error('Failed to create refund')
    }
  }
  /**
   * Create subscription payment
   */
  async createSubscriptionPayment(
    plan: ISubscriptionPlan,
    userId: string,
    email?: string,
    phone?: string
  ): Promise<IPaymentResponse> {
    const paymentData: IPaymentData = {
      amount: {
        value: plan.price.toFixed(2),
        currency: plan.currency
      },
      description: `Подписка: ${plan.name}`,
      metadata: {
        userId,
        planId: plan.id,
        planName: plan.name,
        period: plan.period
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${window.location.origin}/subscription/success?plan=${plan.id}`
      }
    }
    // Add receipt if email or phone provided
    if (email || phone) {
      paymentData.receipt = {
        customer: {
          email,
          phone
        },
        items: [{
          description: plan.name,
          quantity: 1,
          amount: {
            value: plan.price.toFixed(2),
            currency: plan.currency
          },
          vat_code: 1, // НДС не облагается
          payment_subject: 'service',
          payment_mode: 'full_payment'
        }]
      }
    }
    return this.createPayment(paymentData)
  }
  /**
   * Create ride payment
   */
  async createRidePayment(
    orderId: string,
    amount: number,
    description: string,
    userId: string,
    driverId?: string
  ): Promise<IPaymentResponse> {
    const paymentData: IPaymentData = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      description,
      metadata: {
        orderId,
        userId,
        driverId,
        type: 'ride'
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${window.location.origin}/order/${orderId}/payment-success`
      }
    }
    return this.createPayment(paymentData)
  }
  /**
   * Generate unique idempotence key
   */
  private generateIdempotenceKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    // Implementation depends on YooKassa webhook signature method
    // This is a placeholder implementation
    return true
  }
}
// Subscription plans
export const SUBSCRIPTION_PLANS: ISubscriptionPlan[] = [
  {
    id: 'driver_basic',
    name: 'Водитель Базовый',
    description: 'Базовый тариф для водителей',
    price: 1990,
    currency: 'RUB',
    period: 'monthly',
    features: [
      'До 50 заказов в месяц',
      'Базовая поддержка',
      'Стандартная комиссия 15%'
    ]
  },
  {
    id: 'driver_premium',
    name: 'Водитель Премиум',
    description: 'Премиум тариф для водителей',
    price: 3990,
    currency: 'RUB',
    period: 'monthly',
    features: [
      'Неограниченные заказы',
      'Приоритетная поддержка 24/7',
      'Сниженная комиссия 10%',
      'Приоритет в распределении заказов',
      'Детальная статистика'
    ]
  },
  {
    id: 'driver_yearly',
    name: 'Водитель Годовой',
    description: 'Годовая подписка со скидкой',
    price: 39990,
    currency: 'RUB',
    period: 'yearly',
    features: [
      'Все преимущества Премиум',
      'Скидка 20% от месячного тарифа',
      'Бонусные дни подписки',
      'Персональный менеджер'
    ]
  },
  {
    id: 'client_vip',
    name: 'Клиент VIP',
    description: 'VIP подписка для клиентов',
    price: 990,
    currency: 'RUB',
    period: 'monthly',
    features: [
      'Приоритетная подача автомобилей',
      'Скидка 10% на все поездки',
      'Бесплатная отмена заказов',
      'VIP поддержка'
    ]
  }
]
// Initialize service with environment variables
const yooKassaConfig: IYooKassaConfig = {
  shopId: process.env.REACT_APP_YOOKASSA_SHOP_ID || '',
  secretKey: process.env.REACT_APP_YOOKASSA_SECRET_KEY || '',
  returnUrl: process.env.REACT_APP_YOOKASSA_RETURN_URL || window.location.origin + '/payment/success',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'test'
}
export default new YooKassaService(yooKassaConfig)
// Export types
export type {
  IPaymentData,
  IPaymentResponse,
  ISubscriptionPlan,
  IRefundData,
  IReceipt,
  IReceiptItem
}