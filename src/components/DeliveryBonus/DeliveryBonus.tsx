import React from 'react'
import './styles.scss'

interface IDeliveryBonusProps {
  orderId: string
  currentBonus: number
  onBonusChange: (orderId: string, amount: number) => void
  onClose: () => void
}

const DeliveryBonus: React.FC<IDeliveryBonusProps> = ({
  orderId,
  currentBonus,
  onBonusChange,
  onClose
}) => {
  const bonusOptions = [10, 20, 50, 100]

  const handleIncrease = (amount: number) => {
    onBonusChange(orderId, amount)
  }

  const handleDecrease = () => {
    if (currentBonus >= 10) {
      onBonusChange(orderId, -10)
    }
  }

  const handleReset = () => {
    onBonusChange(orderId, -currentBonus)
  }

  return (
    <div className="delivery-bonus">
      <div className="delivery-bonus__header">
        <h3 className="delivery-bonus__title">На подачу</h3>
        <button
          className="delivery-bonus__close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>

      <div className="delivery-bonus__current">
        <span className="delivery-bonus__label">Текущая сумма:</span>
        <span className="delivery-bonus__amount">{currentBonus} MAD</span>
      </div>

      <div className="delivery-bonus__controls">
        <div className="delivery-bonus__quick-buttons">
          {bonusOptions.map(amount => (
            <button
              key={amount}
              className="delivery-bonus__btn delivery-bonus__btn--add"
              onClick={() => handleIncrease(amount)}
            >
              +{amount}
            </button>
          ))}
        </div>

        <div className="delivery-bonus__adjust-buttons">
          <button
            className="delivery-bonus__btn delivery-bonus__btn--decrease"
            onClick={handleDecrease}
            disabled={currentBonus === 0}
          >
            -10
          </button>
          <button
            className="delivery-bonus__btn delivery-bonus__btn--reset"
            onClick={handleReset}
            disabled={currentBonus === 0}
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className="delivery-bonus__info">
        <p>Увеличение суммы "На подачу" повышает привлекательность заказа для водителей</p>
      </div>
    </div>
  )
}

export default DeliveryBonus