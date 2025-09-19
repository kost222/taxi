import React from 'react'
import { ConnectedProps, connect } from 'react-redux'
import { IRootState } from '../../../state'
import { ordersSelectors } from '../../../state/orders'
import { EPaymentType, getOrderCount, getOrderIcon, getPayment } from '../../../tools/utils'
import { EBookingDriverState, EColorTypes, IOrder } from '../../../types/types'
import cn from 'classnames'
import { t, TRANSLATION } from '../../../localization'
import images from '../../../constants/images'
import Button from '../../Button'
import ChatToggler from '../../Chat/Toggler'
import { clientOrderActionCreators } from '../../../state/clientOrder'
import { modalsActionCreators } from '../../../state/modals'
import './styles.scss'

const mapStateToProps = (state: IRootState) => ({
  activeOrders: ordersSelectors.activeOrders(state),
})

const mapDispatchToProps = {
  setSelectedOrder: clientOrderActionCreators.setSelectedOrder,
  setCancelModal: modalsActionCreators.setCancelModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
  handleOrderClick: (order: IOrder) => any
}

const PassengerMiniOrders: React.FC<IProps> = ({
  activeOrders,
  setSelectedOrder,
  setCancelModal,
  handleOrderClick,
}) => {
  if (!activeOrders?.length) return null

  const getCardClass = () => {
    const orderCount = activeOrders.length
    if (orderCount === 1) return 'one-order'
    if (orderCount === 2) return 'two-orders'
    if (orderCount === 3) return 'three-orders'
    if (orderCount === 4) return 'four-orders'
    return 'five-plus-orders'
  }

  return (
    <div className={`passenger-order__mini-orders ${getCardClass()}`}>
      {
        activeOrders.map((order, index) => {
          const payment = getPayment(order)
          const orderDriver = order?.drivers &&
            order
              ?.drivers
              .find(item => item.c_state !== EBookingDriverState.Canceled)

          return (
            <div
              key={order.b_id}
              className="taxi-order-card with-cancel"
              onClick={() => handleOrderClick(order)}
            >
              <div className="order-top">
                <span className="order-number">№ {order.b_id}</span>
                <span className="order-status">
                  {(order as any).status || (
                    !!order.drivers?.length ?
                      t(TRANSLATION.BOOKING_DRIVER_STATES[order.drivers[0].c_state || EBookingDriverState.Performer]) :
                      'Search'
                  )}
                </span>
              </div>

              <div className="rating-stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`star ${i < ((order as any).rating || 5) ? 'filled' : 'empty'}`}>★</span>
                ))}
              </div>

              <div className="order-info-row">
                <div className="passengers">
                  <img src={images.peopleIcon} alt="passengers" className="icon" />
                  <span>{(order as any).passengers || 1}</span>
                </div>
              </div>

              <div className="order-info-row">
                <div className="time">
                  <img src={images.time} alt="time" className="icon" />
                  <span>{order.b_estimate_waiting || '0:28'}</span>
                </div>
              </div>

              <div className="order-info-row">
                <div className="price">
                  <img src={images.moneyIcon} alt="price" className="icon" />
                  <span>-{(order as any).b_amount} {(order as any).currency || 'GHS'}</span>
                </div>
              </div>

              <Button
                type="button"
                text="Cancel"
                colorType={EColorTypes.Accent}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedOrder(order.b_id)
                  setCancelModal(true)
                }}
                className="cancel-btn"
              />
            </div>
          )
        })
      }
    </div>
  )
}

export default connector(PassengerMiniOrders)
