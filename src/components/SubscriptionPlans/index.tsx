import React, { useState } from 'react'
import './styles.scss'
import { t, TRANSLATION } from '../../localization'

interface IPlan {
  id: string
  name: string
  price: number
  period: 'month' | 'year'
  features: string[]
  popular?: boolean
  discount?: number
}

const plans: IPlan[] = [
  {
    id: 'basic',
    name: 'Базовый',
    price: 299,
    period: 'month',
    features: [
      '10 поездок в месяц',
      'Стандартные классы авто',
      'Базовая поддержка',
      'История поездок'
    ]
  },
  {
    id: 'premium',
    name: 'Премиум',
    price: 799,
    period: 'month',
    popular: true,
    features: [
      'Безлимитные поездки',
      'Все классы авто',
      'Приоритетная поддержка 24/7',
      'Кэшбэк 5%',
      'Бесплатная отмена',
      'VIP ожидание'
    ]
  },
  {
    id: 'business',
    name: 'Бизнес',
    price: 2499,
    period: 'month',
    features: [
      'Корпоративный аккаунт',
      'До 50 сотрудников',
      'Детальная отчетность',
      'Персональный менеджер',
      'Кэшбэк 10%',
      'API интеграция',
      'Брендирование'
    ]
  },
  {
    id: 'yearly',
    name: 'Годовой Премиум',
    price: 7999,
    period: 'year',
    discount: 20,
    features: [
      'Все преимущества Премиум',
      'Экономия 20%',
      '2 месяца в подарок',
      'Эксклюзивные предложения',
      'Ранний доступ к новым функциям'
    ]
  }
]

interface IProps {
  onSubscribe?: (planId: string) => void
  currentPlanId?: string
}

const SubscriptionPlans: React.FC<IProps> = ({ onSubscribe, currentPlanId }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(currentPlanId || null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month')

  const handleSubscribe = async (planId: string) => {
    setIsProcessing(true)

    try {
      // Создание платежа через ЮКасса
      const payment = await createYooKassaPayment(planId)

      // Перенаправление на страницу оплаты
      if (payment.confirmation?.confirmation_url) {
        window.location.href = payment.confirmation.confirmation_url
      }

      onSubscribe?.(planId)
    } catch (error) {
      console.error('Ошибка при создании подписки:', error)
      alert('Ошибка при создании подписки. Попробуйте позже.')
    } finally {
      setIsProcessing(false)
    }
  }

  const createYooKassaPayment = async (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan) throw new Error('План не найден')

    const response = await fetch('/api/payments/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        amount: plan.price,
        currency: 'RUB',
        description: `Подписка "${plan.name}"`,
        metadata: {
          planId,
          period: plan.period,
          userId: localStorage.getItem('userId') || ''
        }
      })
    })

    if (!response.ok) {
      throw new Error('Ошибка создания платежа')
    }

    return response.json()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price)
  }

  const filteredPlans = plans.filter(plan =>
    billingPeriod === 'year' ? plan.period === 'year' : plan.period === 'month'
  )

  return (
    <div className="subscription-plans">
      <div className="subscription-plans__header">
        <h2 className="subscription-plans__title">
          {t(TRANSLATION.SUBSCRIPTION_TITLE) || 'Выберите план подписки'}
        </h2>
        <p className="subscription-plans__subtitle">
          Экономьте на поездках с нашими выгодными тарифами
        </p>

        <div className="subscription-plans__toggle">
          <button
            className={`subscription-plans__toggle-btn ${billingPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('month')}
          >
            Ежемесячно
          </button>
          <button
            className={`subscription-plans__toggle-btn ${billingPeriod === 'year' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('year')}
          >
            Ежегодно
            <span className="subscription-plans__toggle-badge">-20%</span>
          </button>
        </div>
      </div>

      <div className="subscription-plans__grid">
        {filteredPlans.map(plan => (
          <div
            key={plan.id}
            className={`subscription-plan ${plan.popular ? 'subscription-plan--popular' : ''} ${
              currentPlanId === plan.id ? 'subscription-plan--current' : ''
            }`}
          >
            {plan.popular && (
              <div className="subscription-plan__badge">Популярный</div>
            )}

            {plan.discount && (
              <div className="subscription-plan__discount">-{plan.discount}%</div>
            )}

            <div className="subscription-plan__header">
              <h3 className="subscription-plan__name">{plan.name}</h3>
              <div className="subscription-plan__price">
                <span className="subscription-plan__amount">{formatPrice(plan.price)}</span>
                <span className="subscription-plan__period">
                  /{plan.period === 'month' ? 'месяц' : 'год'}
                </span>
              </div>
            </div>

            <ul className="subscription-plan__features">
              {plan.features.map((feature, index) => (
                <li key={index} className="subscription-plan__feature">
                  <svg className="subscription-plan__feature-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`subscription-plan__button ${
                currentPlanId === plan.id ? 'subscription-plan__button--current' : ''
              }`}
              onClick={() => handleSubscribe(plan.id)}
              disabled={isProcessing || currentPlanId === plan.id}
            >
              {isProcessing ? (
                <span className="subscription-plan__loading">Обработка...</span>
              ) : currentPlanId === plan.id ? (
                'Текущий план'
              ) : (
                'Выбрать план'
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="subscription-plans__footer">
        <p className="subscription-plans__note">
          💳 Безопасная оплата через ЮKassa
        </p>
        <p className="subscription-plans__note">
          🔄 Отмена подписки в любое время
        </p>
        <p className="subscription-plans__note">
          ✅ Моментальная активация после оплаты
        </p>
      </div>
    </div>
  )
}

export default SubscriptionPlans