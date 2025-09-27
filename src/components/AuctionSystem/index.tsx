// Task 23: Full auction price implementation
import React, { useState, useEffect, useRef } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { useInterval } from '../../tools/hooks'
import { t, TRANSLATION } from '../../localization'
import { IRootState } from '../../state'
import { userSelectors } from '../../state/user'
import { EStatuses } from '../../types/types'
import './styles.scss'
import { showWarning } from '../../utils/notifications'
import { TIMEOUTS, RATIOS } from '../../constants/timeouts'
interface IAuctionBid {
  id: string
  driverId: string
  driverName: string
  driverRating: number
  price: number
  pickupTime: number // minutes
  carClass: string
  carModel: string
  timestamp: Date
  isWinning?: boolean
}
interface IAuction {
  orderId: string
  basePrice: number
  currentPrice: number
  startTime: Date
  endTime: Date
  status: 'pending' | 'active' | 'ended' | 'cancelled'
  bids: IAuctionBid[]
  winnerBid?: IAuctionBid
  minBidStep: number
  autoAcceptPrice?: number // Price at which order is automatically accepted
}
const mapStateToProps = (state: IRootState) => ({
  user: userSelectors.user(state),
})
const connector = connect(mapStateToProps)
interface IProps extends ConnectedProps<typeof connector> {
  orderId: string
  basePrice: number
  isDriver?: boolean
  onBidPlaced?: (bid: IAuctionBid) => void
  onAuctionEnd?: (winner: IAuctionBid | null) => void
  auctionDuration?: number // minutes
}
const AuctionSystem: React.FC<IProps> = ({
  orderId,
  basePrice,
  isDriver = false,
  user,
  onBidPlaced,
  onAuctionEnd,
  auctionDuration = 5 // 5 minutes by default
}) => {
  const [auction, setAuction] = useState<IAuction>({
    orderId,
    basePrice,
    currentPrice: basePrice,
    startTime: new Date(),
    endTime: new Date(Date.now() + auctionDuration * TIMEOUTS.AUCTION_DURATION_MULTIPLIER),
    status: 'active',
    bids: [],
    minBidStep: Math.round(basePrice * 0.02), // 2% of base price
    autoAcceptPrice: Math.round(basePrice * RATIOS.AUTO_ACCEPT_RATIO) // 30% discount triggers auto-accept
  })
  const [myBid, setMyBid] = useState<number>(basePrice)
  const [isBidding, setIsBidding] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(auctionDuration * 60)
  const [showBidHistory, setShowBidHistory] = useState(false)
  const [autoBidEnabled, setAutoBidEnabled] = useState(false)
  const [maxAutoBid, setMaxAutoBid] = useState(basePrice)
  const wsRef = useRef<WebSocket | null>(null)
  useEffect(() => {
    // Connect to WebSocket for real-time bidding
    connectToAuctionWebSocket()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [orderId])
  useInterval(() => {
    const now = new Date()
    const remaining = Math.max(0, Math.floor((auction.endTime.getTime() - now.getTime()) / 1000))
    setTimeLeft(remaining)
    if (remaining === 0 && auction.status === 'active') {
      endAuction()
    }
  }, 1000)
  const connectToAuctionWebSocket = () => {
    // In production, connect to real WebSocket server
    // wsRef.current = new WebSocket(`wss://api.example.com/auction/${orderId}`)
    // Simulate WebSocket with mock data
    simulateIncomingBids()
  }
  // Use ref to track intervals for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const simulateIncomingBids = () => {
    // Clear existing intervals first
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    // Simulate other drivers bidding
    intervalRef.current = setInterval(() => {
      if (auction.status !== 'active' || Math.random() > 0.3) return
      const mockBid: IAuctionBid = {
        id: `bid-${Date.now()}`,
        driverId: `driver-${Math.floor(Math.random() * 100)}`,
        driverName: ['Александр', 'Михаил', 'Сергей'][Math.floor(Math.random() * 3)],
        driverRating: 4 + Math.random(),
        price: auction.currentPrice - auction.minBidStep * (1 + Math.random() * 2),
        pickupTime: 5 + Math.floor(Math.random() * 10),
        carClass: ['economy', 'comfort', 'business'][Math.floor(Math.random() * 3)],
        carModel: ['Toyota Camry', 'Hyundai Solaris', 'Kia Rio'][Math.floor(Math.random() * 3)],
        timestamp: new Date()
      }
      handleIncomingBid(mockBid)
    }, TIMEOUTS.AUCTION_BID_INTERVAL_MIN + Math.random() * TIMEOUTS.AUCTION_BID_INTERVAL_RANDOM)
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, auctionDuration * TIMEOUTS.AUCTION_DURATION_MULTIPLIER)
  }
  // Cleanup intervals on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  const handleIncomingBid = (bid: IAuctionBid) => {
    setAuction(prev => {
      const newBids = [...prev.bids, bid].sort((a, b) => a.price - b.price)
      const lowestBid = newBids[0]
      // Check for auto-accept condition
      if (bid.price <= prev.autoAcceptPrice!) {
        endAuction(bid)
        return {
          ...prev,
          bids: newBids,
          currentPrice: bid.price,
          winnerBid: bid,
          status: 'ended'
        }
      }
      // Auto-bid if enabled and we're being outbid
      if (autoBidEnabled && isDriver && bid.driverId !== user?.u_id) {
        if (bid.price < myBid && myBid - prev.minBidStep >= bid.price - prev.minBidStep && myBid <= maxAutoBid) {
          const autoBidAmount = Math.max(bid.price - prev.minBidStep, prev.basePrice * RATIOS.MIN_BID_RATIO)
          setTimeout(() => placeBid(autoBidAmount), TIMEOUTS.AUTO_BID_DELAY + Math.random() * TIMEOUTS.AUTO_BID_RANDOM_DELAY)
        }
      }
      return {
        ...prev,
        bids: newBids,
        currentPrice: lowestBid.price
      }
    })
  }
  const placeBid = async (bidAmount?: number) => {
    if (!isDriver || !user) return
    const amount = bidAmount || myBid
    if (amount >= auction.currentPrice) {
      showWarning('Ваша ставка должна быть ниже текущей цены')
      return
    }
    if (amount < auction.basePrice * RATIOS.MIN_BID_RATIO) {
      showWarning('Минимальная ставка: ' + Math.round(auction.basePrice * RATIOS.MIN_BID_RATIO) + ' руб.')
      return
    }
    setIsBidding(true)
    try {
      const newBid: IAuctionBid = {
        id: `bid-${Date.now()}`,
        driverId: user.u_id,
        driverName: user.u_name || 'Вы',
        driverRating: 4.8, // Should come from user profile
        price: amount,
        pickupTime: 7, // Should be calculated based on distance
        carClass: 'comfort', // Should come from driver's car info
        carModel: 'Toyota Camry', // Should come from driver's car info
        timestamp: new Date()
      }
      handleIncomingBid(newBid)
      if (onBidPlaced) {
        onBidPlaced(newBid)
      }
      setMyBid(amount - auction.minBidStep)
    } catch (error) {
    } finally {
      setIsBidding(false)
    }
  }
  const endAuction = (winner?: IAuctionBid) => {
    const winningBid = winner || auction.bids[0] || null
    setAuction(prev => ({
      ...prev,
      status: 'ended',
      winnerBid: winningBid || undefined
    }))
    if (onAuctionEnd) {
      onAuctionEnd(winningBid)
    }
  }
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }
  const getDiscountPercentage = (price: number): number => {
    return Math.round((1 - price / basePrice) * 100)
  }
  return (
    <div className="auction-system">
      <div className="auction-header">
        <h3>Аукцион на заказ #{orderId}</h3>
        <div className={`auction-timer ${timeLeft < 60 ? 'auction-timer--urgent' : ''}`}>
          {auction.status === 'active' ? (
            <>
              <span className="timer-icon">⏱️</span>
              <span className="timer-text">{formatTime(timeLeft)}</span>
            </>
          ) : (
            <span className="status-badge status-badge--{auction.status}">
              {auction.status === 'ended' ? 'Завершен' : 'Отменен'}
            </span>
          )}
        </div>
      </div>
      <div className="auction-info">
        <div className="price-info">
          <div className="price-row">
            <span className="label">Начальная цена:</span>
            <span className="value">{formatPrice(basePrice)}</span>
          </div>
          <div className="price-row current">
            <span className="label">Текущая цена:</span>
            <span className="value">
              {formatPrice(auction.currentPrice)}
              {auction.currentPrice < basePrice && (
                <span className="discount">-{getDiscountPercentage(auction.currentPrice)}%</span>
              )}
            </span>
          </div>
          {auction.autoAcceptPrice && (
            <div className="price-row auto-accept">
              <span className="label">Авто-принятие:</span>
              <span className="value">{formatPrice(auction.autoAcceptPrice)}</span>
            </div>
          )}
        </div>
        <div className="bid-stats">
          <div className="stat">
            <span className="stat-value">{auction.bids.length}</span>
            <span className="stat-label">Предложений</span>
          </div>
          <div className="stat">
            <span className="stat-value">{auction.bids.filter(b => b.driverId === user?.u_id).length}</span>
            <span className="stat-label">Ваши ставки</span>
          </div>
          <div className="stat">
            <span className="stat-value">{formatPrice(auction.minBidStep)}</span>
            <span className="stat-label">Мин. шаг</span>
          </div>
        </div>
      </div>
      {isDriver && auction.status === 'active' && (
        <div className="bidding-section">
          <div className="bid-input">
            <label>Ваша ставка</label>
            <div className="input-group">
              <button
                onClick={() => setMyBid(prev => Math.max(auction.basePrice * RATIOS.MIN_BID_RATIO, prev - auction.minBidStep))}
                disabled={myBid <= auction.basePrice * RATIOS.MIN_BID_RATIO}
              >
                −
              </button>
              <input
                type="number"
                value={myBid}
                onChange={(e) => setMyBid(Number(e.target.value))}
                min={auction.basePrice * RATIOS.MIN_BID_RATIO}
                max={auction.currentPrice - auction.minBidStep}
              />
              <button
                onClick={() => setMyBid(prev => Math.min(auction.currentPrice - auction.minBidStep, prev + auction.minBidStep))}
                disabled={myBid >= auction.currentPrice - auction.minBidStep}
              >
                +
              </button>
            </div>
            <div className="quick-bids">
              <button onClick={() => setMyBid(auction.currentPrice - auction.minBidStep)}>
                Мин. ставка
              </button>
              <button onClick={() => setMyBid(Math.round(basePrice * 0.85))}>
                -15%
              </button>
              <button onClick={() => setMyBid(Math.round(basePrice * 0.8))}>
                -20%
              </button>
              <button onClick={() => setMyBid(Math.round(basePrice * RATIOS.MIN_BID_RATIO))}>
                -30%
              </button>
            </div>
          </div>
          <div className="auto-bid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoBidEnabled}
                onChange={(e) => setAutoBidEnabled(e.target.checked)}
              />
              <span>Автоматические ставки</span>
            </label>
            {autoBidEnabled && (
              <div className="auto-bid-limit">
                <label>Максимальная ставка</label>
                <input
                  type="number"
                  value={maxAutoBid}
                  onChange={(e) => setMaxAutoBid(Number(e.target.value))}
                  min={auction.basePrice * RATIOS.MIN_BID_RATIO}
                  max={basePrice}
                />
              </div>
            )}
          </div>
          <button
            className="place-bid-btn"
            onClick={() => placeBid()}
            disabled={isBidding || myBid >= auction.currentPrice}
          >
            {isBidding ? 'Размещение...' : `Предложить ${formatPrice(myBid)}`}
          </button>
        </div>
      )}
      <div className="bids-section">
        <div className="bids-header">
          <h4>История предложений</h4>
          <button
            className="toggle-history"
            onClick={() => setShowBidHistory(!showBidHistory)}
          >
            {showBidHistory ? 'Скрыть' : 'Показать все'}
          </button>
        </div>
        <div className={`bids-list ${showBidHistory ? 'bids-list--expanded' : ''}`}>
          {auction.bids.length === 0 ? (
            <div className="no-bids">Пока нет предложений</div>
          ) : (
            auction.bids
              .slice(0, showBidHistory ? undefined : 3)
              .map((bid, index) => (
                <div
                  key={bid.id}
                  className={`bid-item ${index === 0 ? 'bid-item--leading' : ''} ${bid.driverId === user?.u_id ? 'bid-item--mine' : ''}`}
                >
                  <div className="bid-rank">#{index + 1}</div>
                  <div className="bid-details">
                    <div className="bid-driver">
                      <span className="driver-name">{bid.driverName}</span>
                      <span className="driver-rating">⭐ {bid.driverRating.toFixed(1)}</span>
                    </div>
                    <div className="bid-info">
                      <span className="car-info">{bid.carModel} • {getCarClassName(bid.carClass)}</span>
                      <span className="pickup-time">~{bid.pickupTime} мин</span>
                    </div>
                  </div>
                  <div className="bid-price">
                    <span className="price">{formatPrice(bid.price)}</span>
                    <span className="discount">-{getDiscountPercentage(bid.price)}%</span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
      {auction.status === 'ended' && auction.winnerBid && (
        <div className="auction-result">
          <h4>Аукцион завершен!</h4>
          <div className="winner-info">
            <div className="winner-badge">🏆</div>
            <div className="winner-details">
              <p className="winner-name">{auction.winnerBid.driverName}</p>
              <p className="winner-price">Выигрышная ставка: {formatPrice(auction.winnerBid.price)}</p>
              <p className="winner-savings">Экономия: {formatPrice(basePrice - auction.winnerBid.price)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
const getCarClassName = (carClass: string): string => {
  const classNames: Record<string, string> = {
    economy: 'Эконом',
    comfort: 'Комфорт',
    business: 'Бизнес'
  }
  return classNames[carClass] || carClass
}
export default connector(AuctionSystem)