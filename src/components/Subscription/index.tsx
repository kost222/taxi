import React, { useState, useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { t, TRANSLATION } from '../../localization'
import yooKassaService, { SUBSCRIPTION_PLANS, ISubscriptionPlan } from '../../services/yookassa'
import { IRootState } from '../../state'
import { userSelectors } from '../../state/user'
import { modalsActionCreators } from '../../state/modals'
import { EStatuses, EUserRoles } from '../../types/types'
import Button from '../Button'
import './styles.scss'
const mapStateToProps = (state: IRootState) => ({
  user: userSelectors.user(state),
})
const mapDispatchToProps = {
  setMessageModal: modalsActionCreators.setMessageModal,
}
const connector = connect(mapStateToProps, mapDispatchToProps)
interface IProps extends ConnectedProps<typeof connector> {}
const Subscription: React.FC<IProps> = ({ user, setMessageModal }) => {
  const [selectedPlan, setSelectedPlan] = useState<ISubscriptionPlan | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [email, setEmail] = useState(user?.u_email || '')
  const [phone, setPhone] = useState(user?.u_phone || '')
  useEffect(() => {
    loadCurrentSubscription()
  }, [])
  const loadCurrentSubscription = async () => {
    // Load current subscription from API
    try {
      // This would normally fetch from your backend
      // const subscription = await API.getCurrentSubscription(user?.u_id)
      // setCurrentSubscription(subscription)
    } catch (error) {
    }
  }
  const handleSubscribe = async (plan: ISubscriptionPlan) => {
    if (!user) {
      setMessageModal({
        isOpen: true,
        status: EStatuses.Fail,
        message: 'Необходимо войти в систему'
      })
      return
    }
    setIsProcessing(true)
    setSelectedPlan(plan)
    try {
      const payment = await yooKassaService.createSubscriptionPayment(
        plan,
        user.u_id,
        email,
        phone
      )
      if (payment.confirmation?.confirmation_url) {
        // Redirect to YooKassa payment page
        window.location.href = payment.confirmation.confirmation_url
      } else {
        throw new Error('No payment URL received')
      }
    } catch (error: any) {
      setMessageModal({
        isOpen: true,
        status: EStatuses.Fail,
        message: error.message || 'Ошибка при создании подписки'
      })
    } finally {
      setIsProcessing(false)
    }
  }
  const handleCancelSubscription = async () => {
    if (!currentSubscription) return
    if (!window.confirm('Вы уверены, что хотите отменить подписку?')) {
      return
    }
    setIsProcessing(true)
    try {
      // Cancel subscription via your backend API
      // await API.cancelSubscription(currentSubscription.id)
      setCurrentSubscription(null)
      setMessageModal({
        isOpen: true,
        status: EStatuses.Success,
        message: 'Подписка успешно отменена'
      })
    } catch (error: any) {
      setMessageModal({
        isOpen: true,
        status: EStatuses.Fail,
        message: 'Ошибка при отмене подписки'
      })
    } finally {
      setIsProcessing(false)
    }
  }
  const getPlanForUser = () => {
    // Filter plans based on user role
    const isDriver = user?.u_role === EUserRoles.Driver
    return SUBSCRIPTION_PLANS.filter(plan =>
      isDriver ? plan.id.startsWith('driver_') : plan.id.startsWith('client_')
    )
  }
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }
  const plans = getPlanForUser()
  return (
    <div className="subscription">
      <div className="subscription__header">
        <h2>{t(TRANSLATION.SUBSCRIPTION_TITLE)}</h2>
        <p className="subscription__subtitle">
          Выберите подходящий тарифный план для вашего бизнеса
        </p>
      </div>
      {currentSubscription && (
        <div className="subscription__current">
          <div className="current-plan">
            <h3>Текущий план: {currentSubscription.name}</h3>
            <p>Действителен до: {new Date(currentSubscription.expiresAt).toLocaleDateString('ru-RU')}</p>
            <Button
              text="Отменить подписку"
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            />
          </div>
        </div>
      )}
      <div className="subscription__plans">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`plan-card ${plan.id.includes('premium') || plan.id.includes('vip') ? 'plan-card--featured' : ''}`}
          >
            {(plan.id.includes('premium') || plan.id.includes('vip')) && (
              <div className="plan-badge">Популярный</div>
            )}
            <div className="plan-header">
              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-description">{plan.description}</p>
            </div>
            <div className="plan-price">
              <span className="price-amount">{formatPrice(plan.price)}</span>
              <span className="price-period">
                /{plan.period === 'monthly' ? 'месяц' : 'год'}
              </span>
            </div>
            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <svg className="feature-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="plan-action">
              {currentSubscription?.planId === plan.id ? (
                <Button
                  text="Текущий план"
                  disabled={true}
                  className="plan-button plan-button--current"
                />
              ) : (
                <Button
                  text={isProcessing && selectedPlan?.id === plan.id ? "Обработка..." : "Выбрать план"}
                  onClick={() => handleSubscribe(plan)}
                  disabled={isProcessing}
                  className="plan-button"
                />
              )}
            </div>
          </div>
        ))}
      </div>
      {showPaymentForm && selectedPlan && (
        <div className="subscription__payment-form">
          <h3>Оформление подписки: {selectedPlan.name}</h3>
          <div className="payment-form">
            <div className="form-group">
              <label>Email для чека</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.ru"
              />
            </div>
            <div className="form-group">
              <label>Телефон (опционально)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 999-99-99"
              />
            </div>
            <div className="form-actions">
              <Button
                text="Отмена"
                onClick={() => {
                  setShowPaymentForm(false)
                  setSelectedPlan(null)
                }}
                disabled={isProcessing}
              />
              <Button
                text={isProcessing ? "Обработка..." : "Перейти к оплате"}
                onClick={() => handleSubscribe(selectedPlan)}
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>
      )}
      <div className="subscription__footer">
        <p className="footer-text">
          Все платежи защищены и обрабатываются через ЮKassa
        </p>
        <div className="payment-methods">
          <img src="/images/visa.svg" alt="Visa" />
          <img src="/images/mastercard.svg" alt="Mastercard" />
          <img src="/images/mir.svg" alt="Мир" />
          <img src="/images/yookassa.svg" alt="ЮKassa" />
        </div>
      </div>
    </div>
  )
}
export default connector(Subscription)