import React, { useState, useRef, useEffect } from 'react'
import './styles.scss'

interface Order {
  b_id: string
  b_payment?: number
  b_start_address?: string
  b_destination_address?: string
  b_start_datetime?: any
  deliveryBonus?: number
}

interface DeliveryBonusPanelProps {
  orders: Order[]
  onBonusChange: (orderId: string, newBonus: number) => void
}

const DeliveryBonusPanel: React.FC<DeliveryBonusPanelProps> = ({ orders, onBonusChange }) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [bonuses, setBonuses] = useState<{[key: string]: number}>({})
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)

  // Обработка скролла для определения текущей плашки
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (!isScrolling) {
        const containerRect = container.getBoundingClientRect()
        const centerX = containerRect.left + containerRect.width / 2

        const cards = container.querySelectorAll('.order-card')
        let closestCard: Element | null = null
        let closestDistance = Infinity

        cards.forEach(card => {
          const rect = card.getBoundingClientRect()
          const cardCenterX = rect.left + rect.width / 2
          const distance = Math.abs(cardCenterX - centerX)

          if (distance < closestDistance) {
            closestDistance = distance
            closestCard = card as HTMLElement
          }
        })

        if (closestCard) {
          const orderId = (closestCard as HTMLElement).getAttribute('data-order-id')
          if (orderId) {
            setSelectedOrderId(orderId)
          }
        }
      }
    }

    const scrollEndTimer = () => {
      setIsScrolling(false)
      handleScroll()
    }

    let scrollTimer: NodeJS.Timeout

    const onScroll = () => {
      setIsScrolling(true)
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(scrollEndTimer, 150)
    }

    container.addEventListener('scroll', onScroll)
    handleScroll() // Установить начальную плашку

    return () => {
      container.removeEventListener('scroll', onScroll)
      clearTimeout(scrollTimer)
    }
  }, [orders])

  // Прокрутка к выбранной плашке
  const scrollToOrder = (orderId: string) => {
    const container = scrollContainerRef.current
    if (!container) return

    const card = container.querySelector(`[data-order-id="${orderId}"]`)
    if (card) {
      const containerRect = container.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()

      const scrollLeft = container.scrollLeft + cardRect.left - containerRect.left -
                        (containerRect.width - cardRect.width) / 2

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      })

      setSelectedOrderId(orderId)
    }
  }

  // Увеличение суммы "На подачу"
  const increaseBonus = (amount: number) => {
    if (!selectedOrderId) return

    const currentBonus = bonuses[selectedOrderId] || 0
    const newBonus = currentBonus + amount

    setBonuses(prev => ({
      ...prev,
      [selectedOrderId]: newBonus
    }))

    onBonusChange(selectedOrderId, newBonus)
  }

  // Сброс бонуса
  const resetBonus = () => {
    if (!selectedOrderId) return

    setBonuses(prev => ({
      ...prev,
      [selectedOrderId]: 0
    }))

    onBonusChange(selectedOrderId, 0)
  }

  const selectedOrder = orders.find(o => o.b_id === selectedOrderId)
  const currentBonus = selectedOrderId ? (bonuses[selectedOrderId] || 0) : 0

  return (
    <div className="delivery-bonus-panel">
      {/* Горизонтальный скроллинг плашек заказов */}
      <div className="orders-scroll-container" ref={scrollContainerRef}>
        <div className="orders-scroll-wrapper">
          {orders.map(order => {
            const bonus = bonuses[order.b_id] || 0
            const isSelected = order.b_id === selectedOrderId

            return (
              <div
                key={order.b_id}
                data-order-id={order.b_id}
                className={`order-card ${isSelected ? 'order-card--selected' : ''}`}
                onClick={() => scrollToOrder(order.b_id)}
              >
                <div className="order-card__header">
                  <span className="order-card__id">№{order.b_id}</span>
                  <span className="order-card__time">
                    {order.b_start_datetime?.format ?
                      order.b_start_datetime.format('HH:mm') :
                      'Сейчас'}
                  </span>
                </div>

                <div className="order-card__route">
                  <div className="order-card__from">
                    {order.b_start_address || 'Откуда'}
                  </div>
                  <div className="order-card__to">
                    {order.b_destination_address || 'Куда'}
                  </div>
                </div>

                <div className="order-card__footer">
                  <div className="order-card__price">
                    {(order.b_payment || 0) + bonus} MAD
                  </div>
                  {bonus > 0 && (
                    <div className="order-card__bonus">
                      +{bonus} на подачу
                    </div>
                  )}
                </div>

                {isSelected && (
                  <div className="order-card__indicator"></div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Панель управления бонусом "На подачу" */}
      {selectedOrder && (
        <div className="bonus-control">
          <div className="bonus-control__header">
            <h3>Заказ №{selectedOrder.b_id}</h3>
            <span className="bonus-control__status">Текущая плашка</span>
          </div>

          <div className="bonus-control__current">
            <div className="bonus-control__label">На подачу:</div>
            <div className="bonus-control__amount">{currentBonus} MAD</div>
          </div>

          <div className="bonus-control__actions">
            <div className="bonus-control__quick">
              <button
                className="bonus-btn bonus-btn--add"
                onClick={() => increaseBonus(5)}
              >
                +5
              </button>
              <button
                className="bonus-btn bonus-btn--add"
                onClick={() => increaseBonus(10)}
              >
                +10
              </button>
              <button
                className="bonus-btn bonus-btn--add"
                onClick={() => increaseBonus(20)}
              >
                +20
              </button>
              <button
                className="bonus-btn bonus-btn--add"
                onClick={() => increaseBonus(50)}
              >
                +50
              </button>
            </div>

            <div className="bonus-control__other">
              <button
                className="bonus-btn bonus-btn--decrease"
                onClick={() => increaseBonus(-10)}
                disabled={currentBonus < 10}
              >
                -10
              </button>
              <button
                className="bonus-btn bonus-btn--reset"
                onClick={resetBonus}
                disabled={currentBonus === 0}
              >
                Сбросить
              </button>
            </div>
          </div>

          <div className="bonus-control__info">
            <p>Увеличение суммы "На подачу" повышает интерес водителей к заказу</p>
            <p className="bonus-control__total">
              Итоговая сумма: <strong>{(selectedOrder.b_payment || 0) + currentBonus} MAD</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliveryBonusPanel