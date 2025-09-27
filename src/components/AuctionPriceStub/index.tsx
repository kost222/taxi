import React, { useState, useEffect } from 'react'
import './styles.scss'
import { t, TRANSLATION } from '../../localization'

interface IProps {
  basePrice: number
  onBidUpdate?: (newBid: number) => void
}

const AuctionPriceStub: React.FC<IProps> = ({ basePrice, onBidUpdate }) => {
  const [currentBid, setCurrentBid] = useState(basePrice)
  const [timeLeft, setTimeLeft] = useState(300) // 5 минут в секундах
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, timeLeft])

  const handleBidIncrease = (amount: number) => {
    const newBid = currentBid + amount
    setCurrentBid(newBid)
    onBidUpdate?.(newBid)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="auction-price-stub">
      <div className="auction-price-stub__header">
        <span className="auction-price-stub__title">
          {t(TRANSLATION.AUCTION_PRICE) || 'Аукционная цена'}
        </span>
        <span className={`auction-price-stub__timer ${!isActive ? 'auction-price-stub__timer--expired' : ''}`}>
          {isActive ? formatTime(timeLeft) : 'Завершен'}
        </span>
      </div>

      <div className="auction-price-stub__current">
        <span className="auction-price-stub__label">Текущая ставка:</span>
        <span className="auction-price-stub__value">
          {new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'RUB'
          }).format(currentBid)}
        </span>
      </div>

      {isActive && (
        <div className="auction-price-stub__actions">
          <button
            className="auction-price-stub__bid-btn"
            onClick={() => handleBidIncrease(50)}
          >
            +50 ₽
          </button>
          <button
            className="auction-price-stub__bid-btn auction-price-stub__bid-btn--primary"
            onClick={() => handleBidIncrease(100)}
          >
            +100 ₽
          </button>
          <button
            className="auction-price-stub__bid-btn auction-price-stub__bid-btn--premium"
            onClick={() => handleBidIncrease(200)}
          >
            +200 ₽
          </button>
        </div>
      )}

      <div className="auction-price-stub__info">
        <p>💡 Повысьте цену, чтобы водители быстрее откликнулись на заказ</p>
      </div>
    </div>
  )
}

export default AuctionPriceStub