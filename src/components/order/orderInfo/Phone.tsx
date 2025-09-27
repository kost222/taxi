import React from 'react'
import { connect, ConnectedProps } from 'react-redux'
import images from '../../../constants/images'
import { t, TRANSLATION } from '../../../localization'
import { IRootState } from '../../../state'
import { userSelectors } from '../../../state/user'
import { EBookingDriverState, IOrder } from '../../../types/types'
import OrderField from './OrderField'

interface IProps extends ConnectedProps<typeof connector> {
  order: IOrder,
}

const mapStateToProps = (state: IRootState) => ({
  user: userSelectors.user(state),
})

const connector = connect(mapStateToProps)

const OrderPhone: React.FC<IProps> = ({ user, order }) => {
  if (
    !order.b_contact ||
    (
      order.b_comments?.includes('96') &&
      !order.drivers?.find(item => item.c_state > EBookingDriverState.Canceled && item.u_id === user?.u_id)
    )
  ) return null

  return (
    <OrderField
      image={images.phone}
      alt={t(TRANSLATION.PHONE)}
      title={t(TRANSLATION.CLIENT_TEL_MAIN)}
      value={
        <a className="phone-link" href={`tel:${order.b_contact}`}>
          {order.b_contact}
        </a>
      }
    />
  )
}

export default connector(OrderPhone)