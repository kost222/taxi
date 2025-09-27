import React from 'react'
import { t, TRANSLATION } from '../../../localization'
import { CURRENCY } from '../../../siteConstants'
import OrderField from './OrderField'
import { IOrder } from '../../../types/types'
import images from '../../../constants/images'

interface IProps {
  order: IOrder
}

const CurrentPrice: React.FC<IProps> = ({ order }) => {
  const basePrice = order.b_price_estimate || 0
  const pickupFee = order.b_options?.pickup_fee || 0
  const customerPrice = order.b_options?.customer_price || 0

  // Determine which price to show
  const displayPrice = customerPrice || basePrice

  return (
    <div className="order-info__current-price">
      <OrderField
        image={images.cash}
        alt={t(TRANSLATION.PRICE_SETTINGS)}
        title={t(TRANSLATION.CURRENT_PRICE)}
        value={`${displayPrice} ${CURRENCY.SIGN}`}
      />
      {pickupFee > 0 && (
        <OrderField
          image={images.carAlt}
          alt={t(TRANSLATION.PICKUP_FEE)}
          title={t(TRANSLATION.PICKUP_FEE)}
          value={`${pickupFee} ${CURRENCY.SIGN}`}
        />
      )}
      {customerPrice > 0 && (
        <div className="price-breakdown">
          <span className="total-label">{t(TRANSLATION.FINAL_PRICE)}: </span>
          <span className="total-value">{displayPrice + pickupFee} {CURRENCY.SIGN}</span>
        </div>
      )}
    </div>
  )
}

export default CurrentPrice