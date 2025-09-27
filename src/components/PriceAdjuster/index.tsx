import React, { useState, useEffect } from 'react'
import { t, TRANSLATION } from '../../localization'
import './styles.scss'

interface IPriceAdjusterProps {
  basePrice: number
  onPriceChange: (newPrice: number, pickupFee: number) => void
  isAuction?: boolean
  currentBids?: number[]
  minPrice?: number
  maxPrice?: number
}

const PriceAdjuster: React.FC<IPriceAdjusterProps> = ({
  basePrice,
  onPriceChange,
  isAuction = false,
  currentBids = [],
  minPrice,
  maxPrice
}) => {
  const [adjustedPrice, setAdjustedPrice] = useState(basePrice)
  const [pickupFee, setPickupFee] = useState(0)
  const [pricePercentage, setPricePercentage] = useState(0)
  const [showAuctionDetails, setShowAuctionDetails] = useState(false)

  // Calculate min and max based on ±30% rule
  const calculatedMin = minPrice || Math.round(basePrice * 0.7)
  const calculatedMax = maxPrice || Math.round(basePrice * 1.3)

  useEffect(() => {
    setAdjustedPrice(basePrice)
  }, [basePrice])

  const handlePriceChange = (value: number) => {
    const newPrice = Math.max(calculatedMin, Math.min(calculatedMax, value))
    setAdjustedPrice(newPrice)

    // Calculate percentage change
    const percentage = Math.round(((newPrice - basePrice) / basePrice) * 100)
    setPricePercentage(percentage)

    onPriceChange(newPrice, pickupFee)
  }

  const handlePercentageChange = (percentage: number) => {
    const clampedPercentage = Math.max(-30, Math.min(30, percentage))
    setPricePercentage(clampedPercentage)

    const newPrice = Math.round(basePrice * (1 + clampedPercentage / 100))
    setAdjustedPrice(newPrice)
    onPriceChange(newPrice, pickupFee)
  }

  const handlePickupFeeChange = (value: number) => {
    const fee = Math.max(0, value)
    setPickupFee(fee)
    onPriceChange(adjustedPrice, fee)
  }

  const quickAdjustment = (percentage: number) => {
    handlePercentageChange(percentage)
  }

  const getAuctionStatus = () => {
    if (!isAuction || currentBids.length === 0) return null

    const averageBid = currentBids.reduce((a, b) => a + b, 0) / currentBids.length
    const highestBid = Math.max(...currentBids)
    const lowestBid = Math.min(...currentBids)

    return {
      average: Math.round(averageBid),
      highest: highestBid,
      lowest: lowestBid,
      count: currentBids.length
    }
  }

  const auctionStatus = getAuctionStatus()

  return (
    <div className="price-adjuster">
      <div className="price-adjuster__header">
        <h3>{t(TRANSLATION.PRICE_SETTINGS)}</h3>
        {isAuction && (
          <button
            className="auction-toggle"
            onClick={() => setShowAuctionDetails(!showAuctionDetails)}
          >
            {showAuctionDetails ? t(TRANSLATION.HIDE_AUCTION) : t(TRANSLATION.SHOW_AUCTION)}
          </button>
        )}
      </div>

      <div className="price-adjuster__base">
        <label>{t(TRANSLATION.BASE_PRICE)}</label>
        <div className="price-display">
          <span className="currency">₽</span>
          <span className="amount">{basePrice}</span>
        </div>
      </div>

      <div className="price-adjuster__controls">
        <div className="price-input-group">
          <label>{t(TRANSLATION.YOUR_PRICE)}</label>
          <div className="price-input-wrapper">
            <input
              type="number"
              value={adjustedPrice}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              min={calculatedMin}
              max={calculatedMax}
              className="price-input"
            />
            <span className="currency-suffix">₽</span>
          </div>
          <div className="price-range">
            <span className="min">Мин: {calculatedMin}₽</span>
            <span className="max">Макс: {calculatedMax}₽</span>
          </div>
        </div>

        <div className="percentage-adjuster">
          <label>{t(TRANSLATION.PERCENTAGE_ADJUSTMENT)}</label>
          <div className="percentage-slider">
            <input
              type="range"
              min="-30"
              max="30"
              value={pricePercentage}
              onChange={(e) => handlePercentageChange(Number(e.target.value))}
              className="slider"
            />
            <div className="percentage-value">
              {pricePercentage > 0 ? '+' : ''}{pricePercentage}%
            </div>
          </div>
          <div className="quick-buttons">
            <button onClick={() => quickAdjustment(-30)} className="quick-btn negative">
              -30%
            </button>
            <button onClick={() => quickAdjustment(-15)} className="quick-btn negative">
              -15%
            </button>
            <button onClick={() => quickAdjustment(0)} className="quick-btn neutral">
              Базовая
            </button>
            <button onClick={() => quickAdjustment(15)} className="quick-btn positive">
              +15%
            </button>
            <button onClick={() => quickAdjustment(30)} className="quick-btn positive">
              +30%
            </button>
          </div>
        </div>

        <div className="pickup-fee">
          <label>
            {t(TRANSLATION.PICKUP_FEE)}
            <span className="optional">{t(TRANSLATION.OPTIONAL)}</span>
          </label>
          <div className="fee-input-wrapper">
            <input
              type="number"
              value={pickupFee}
              onChange={(e) => handlePickupFeeChange(Number(e.target.value))}
              min="0"
              placeholder="0"
              className="fee-input"
            />
            <span className="currency-suffix">₽</span>
          </div>
          <div className="fee-hint">
            Дополнительная плата за подачу автомобиля
          </div>
        </div>
      </div>

      {isAuction && showAuctionDetails && auctionStatus && (
        <div className="auction-details">
          <h4>{t(TRANSLATION.AUCTION_STATUS)}</h4>
          <div className="auction-stats">
            <div className="stat">
              <span className="stat-label">Предложений:</span>
              <span className="stat-value">{auctionStatus.count}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Минимальная:</span>
              <span className="stat-value">{auctionStatus.lowest}₽</span>
            </div>
            <div className="stat">
              <span className="stat-label">Средняя:</span>
              <span className="stat-value">{auctionStatus.average}₽</span>
            </div>
            <div className="stat">
              <span className="stat-label">Максимальная:</span>
              <span className="stat-value">{auctionStatus.highest}₽</span>
            </div>
          </div>
          {adjustedPrice < auctionStatus.average && (
            <div className="auction-hint competitive">
              Ваша цена ниже средней - высокие шансы на получение заказа
            </div>
          )}
          {adjustedPrice > auctionStatus.highest && (
            <div className="auction-hint warning">
              Ваша цена выше всех предложений - низкие шансы на получение заказа
            </div>
          )}
        </div>
      )}

      <div className="price-adjuster__summary">
        <div className="summary-row">
          <span className="label">Итоговая цена:</span>
          <span className="value total">{adjustedPrice + pickupFee}₽</span>
        </div>
        {pickupFee > 0 && (
          <div className="summary-breakdown">
            <div className="breakdown-item">
              <span>Поездка: {adjustedPrice}₽</span>
            </div>
            <div className="breakdown-item">
              <span>Подача: {pickupFee}₽</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PriceAdjuster