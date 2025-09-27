import React, { useState, useCallback } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { t, TRANSLATION } from '../../localization'
import { CURRENCY } from '../../siteConstants'
import { IRootState } from '../../state'
import { clientOrderSelectors, clientOrderActionCreators } from '../../state/clientOrder'
import './styles.scss'

const mapStateToProps = (state: IRootState) => ({
  deliveryTip: clientOrderSelectors.deliveryTip(state),
})

const mapDispatchToProps = {
  setDeliveryTip: clientOrderActionCreators.setDeliveryTip,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
  className?: string
}

const PRESET_TIPS = [0, 50, 100, 200, 500] // Предустановленные суммы чаевых

const DeliveryTipInput: React.FC<IProps> = ({
  className = '',
  deliveryTip,
  setDeliveryTip,
}) => {
  const [customAmount, setCustomAmount] = useState(false)
  const [inputValue, setInputValue] = useState(deliveryTip.toString())

  const handlePresetClick = useCallback((amount: number) => {
    setDeliveryTip(amount)
    setInputValue(amount.toString())
    setCustomAmount(false)
  }, [setDeliveryTip])

  const handleCustomInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    const numValue = parseInt(value) || 0
    if (numValue >= 0) {
      setDeliveryTip(numValue)
    }
  }, [setDeliveryTip])

  const handleIncrease = useCallback(() => {
    const newValue = deliveryTip + 50
    setDeliveryTip(newValue)
    setInputValue(newValue.toString())
    setCustomAmount(true)
  }, [deliveryTip, setDeliveryTip])

  const handleDecrease = useCallback(() => {
    const newValue = Math.max(0, deliveryTip - 50)
    setDeliveryTip(newValue)
    setInputValue(newValue.toString())
    setCustomAmount(true)
  }, [deliveryTip, setDeliveryTip])

  return (
    <div className={`delivery-tip-input ${className}`}>
      <div className="delivery-tip-input__header">
        <span className="delivery-tip-input__title">
          {t(TRANSLATION.DELIVERY_TIP) || 'На подачу'}
        </span>
        <span className="delivery-tip-input__hint">
          Стимулирует водителей быстрее принять заказ
        </span>
      </div>

      <div className="delivery-tip-input__presets">
        {PRESET_TIPS.map(amount => (
          <button
            key={amount}
            type="button"
            className={`delivery-tip-input__preset ${
              deliveryTip === amount && !customAmount ? 'delivery-tip-input__preset--active' : ''
            }`}
            onClick={() => handlePresetClick(amount)}
          >
            {amount === 0 ? 'Без чаевых' : `${amount} ${CURRENCY.SIGN}`}
          </button>
        ))}
      </div>

      <div className="delivery-tip-input__custom">
        <button
          type="button"
          className="delivery-tip-input__btn delivery-tip-input__btn--minus"
          onClick={handleDecrease}
          disabled={deliveryTip === 0}
        >
          −
        </button>

        <div className="delivery-tip-input__value">
          <input
            type="number"
            value={inputValue}
            onChange={handleCustomInput}
            onFocus={() => setCustomAmount(true)}
            className="delivery-tip-input__input"
            min="0"
            step="50"
          />
          <span className="delivery-tip-input__currency">{CURRENCY.SIGN}</span>
        </div>

        <button
          type="button"
          className="delivery-tip-input__btn delivery-tip-input__btn--plus"
          onClick={handleIncrease}
        >
          +
        </button>
      </div>

      {deliveryTip > 0 && (
        <div className="delivery-tip-input__info">
          <span className="delivery-tip-input__info-icon">💡</span>
          <span className="delivery-tip-input__info-text">
            Водители увидят повышенную стоимость заказа и быстрее откликнутся
          </span>
        </div>
      )}
    </div>
  )
}

export default connector(DeliveryTipInput)