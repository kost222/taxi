import React, { createContext, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import PageSection from '../../components/PageSection'
import StatusCard from '../../components/Card/OrderCard'
import DeliveryBonus from '../../components/DeliveryBonus'
import Separator from '../../components/separator/Separator'
import './styles.scss'
import { t, TRANSLATION } from '../../localization'
import Button from '../../components/Button'
import images from '../../constants/images'
import { IUserState } from '../../state/user/constants'
import { IOrdersState } from '../../state/orders/constants'
import { modalsActionCreators } from '../../state/modals'
import { EBookingDriverState, EColorTypes, IAddressPoint, IUser, IOrder } from '../../types/types'
import { EDriverTabs } from '.'
import MiniOrder from '../../components/driver-order/mini-order'
import { statuses } from '../../constants/miniOrders'
import * as API from '../../API'
import { userActionCreators } from '../../state/user'
import cn from 'classnames'
import SITE_CONSTANTS from '../../siteConstants'
import { TABS } from '../../components/passenger-order/tabs-switcher'

const mapDispatchToProps = {
  setTakePassengerModal: modalsActionCreators.setTakePassengerModal,
  setUser: userActionCreators.setUser,
}

const connector = connect(null, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
  user: IUserState['user'],
  activeOrders: IOrdersState['activeOrders'],
  historyOrders: IOrdersState['historyOrders'],
  readyOrders: IOrdersState['readyOrders'],
  type: Omit<EDriverTabs, EDriverTabs.Map>,
}

interface IOrderWithBonus extends IOrder {
  deliveryBonus?: number
}

const DriverOrdersWithBonus: React.FC<IProps> = ({
  user,
  activeOrders,
  readyOrders,
  historyOrders,
  type,
  setTakePassengerModal,
  setUser,
}) => {
  const [showCandidateOrders, setShowCandidateOrders] = useState(true)
  const [showReadyOrders, setShowReadyOrders] = useState(true)
  const [showHistoryOrders, setShowHistoryOrders] = useState(false)
  const [statusID, setStatusID] = useState(statuses[0].id)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [deliveryBonuses, setDeliveryBonuses] = useState<{[key: string]: number}>({})
  const [showBonusPanel, setShowBonusPanel] = useState(false)

  const navigate = useNavigate()

  const handleOrderClick = (id: string) => {
    if (selectedOrderId === id) {
      setShowBonusPanel(true)
    } else {
      setSelectedOrderId(id)
      setShowBonusPanel(false)
    }
  }

  const handleOrderDoubleClick = (id: string) => {
    navigate(`/driver-order/${id}`)
  }

  const handleBonusChange = (orderId: string, amount: number) => {
    setDeliveryBonuses(prev => ({
      ...prev,
      [orderId]: Math.max(0, (prev[orderId] || 0) + amount)
    }))
  }

  const handleDrovePassengerClick = () => {
    API.setOutDrive(true)
      .then(API.getAuthorizedUser)
      .then((user) => setUser(user))
  }

  const candidateOrders = activeOrders?.filter(item => {
    return (
      item.drivers?.length &&
      item.drivers.find(i => i.u_id === user?.u_id && i.c_state === EBookingDriverState.Considering)
    )
  })

  const activeOrdersWithoutCandidates = activeOrders?.filter(item => !candidateOrders?.includes(item))

  const renderOrderCard = (item: any, isLiteMode: boolean) => {
    const isSelected = selectedOrderId === item.b_id
    const bonus = deliveryBonuses[item.b_id] || 0

    if (isLiteMode) {
      return (
        <div
          key={item.b_id}
          className={cn({ 'order-wrapper--selected': isSelected })}
          onClick={() => handleOrderClick(item.b_id)}
          onDoubleClick={() => handleOrderDoubleClick(item.b_id)}
        >
          <MiniOrder
            user={user as IUser}
            order={item}
            onClick={(e, id) => handleOrderClick(id)}
            key={item.b_id}
          />
          {bonus > 0 && (
            <div className="order-bonus-indicator">
              +{bonus} MAD на подачу
            </div>
          )}
        </div>
      )
    }

    return (
      <div
        key={item.b_id}
        className={cn('order-wrapper', { 'order-wrapper--selected': isSelected })}
        onClick={() => handleOrderClick(item.b_id)}
        onDoubleClick={() => handleOrderDoubleClick(item.b_id)}
      >
        <StatusCard
          className="driver-order-wide-mode-status-card"
          style={{
            boxShadow: isSelected
              ? '0px 1px 7px rgba(255, 36, 0, 0.5)'
              : '0px 1px 7px rgba(0, 0, 0, 0.23)',
            border: isSelected ? '2px solid #FF2400' : 'none'
          }}
          order={{
            ...item,
            b_payment: item.b_payment ? item.b_payment + bonus : bonus
          }}
          user={user as IUser}
        />
        {bonus > 0 && (
          <div className="order-bonus-badge">
            <span>На подачу: +{bonus} MAD</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <PageSection className="driver">
      {
        (
          SITE_CONSTANTS.LIST_OF_MODES_USED[TABS.WAITING.id] ||
            SITE_CONSTANTS.LIST_OF_MODES_USED[TABS.VOTING.id]
        ) && (
          user?.out_drive ?
            <Button
              text={t(TRANSLATION.DROVE_PASSENGER)}
              onClick={handleDrovePassengerClick}
              imageProps={{
                src: images.people,
              }}
              colorType={EColorTypes.Accent}
            /> :
            <Button
              text={t(TRANSLATION.TOOK_PASSENGER)}
              onClick={() => setTakePassengerModal({ isOpen: true })}
              imageProps={{
                src: images.people,
              }}
              colorType={EColorTypes.Accent}
            />
        )
      }

      {selectedOrderId && (
        <div className="selected-order-info">
          <span>Выбран заказ №{selectedOrderId}</span>
          <Button
            text="Настроить бонус"
            onClick={() => setShowBonusPanel(true)}
            colorType={EColorTypes.Default}
          />
        </div>
      )}

      <div className="driver-orders driver-orders--active">
        {
          (activeOrdersWithoutCandidates?.length && activeOrdersWithoutCandidates?.map(item =>
            renderOrderCard(item, type === EDriverTabs.Lite)
          )) || <div className='driver-orders-empty'>{t(TRANSLATION.NO_ACTUAL_DRIVE)}</div>
        }
      </div>

      {!!candidateOrders?.length && (
        <>
          <Separator
            onClick={() => setShowCandidateOrders(prev => !prev)}
            src={showCandidateOrders ? images.minusCircle : images.plusCircle}
            text={t(TRANSLATION.CANDIDATE)}
          />
          <div
            className={cn('driver-orders', { 'driver-orders--active': showCandidateOrders })}
          >
            {
              (candidateOrders?.length && candidateOrders?.map(item =>
                renderOrderCard(item, type === EDriverTabs.Lite)
              )) || <div>{t(TRANSLATION.NO_ACTUAL_DRIVE)}</div>
            }
          </div>
        </>
      )}

      <Separator
        onClick={() => setShowReadyOrders(prev => !prev)}
        active={showReadyOrders}
        text={t(TRANSLATION.ACTUAL)}
      />
      <div
        className={cn('driver-orders', { 'driver-orders--active': showReadyOrders })}
      >
        <div className="driver-statuses">
          {
            statuses.map(status => {
              return (
                <span
                  key={status.id}
                  onClick={() => {
                    setStatusID(status.id)
                  }}
                >
                  <div className={status.className}/>
                  <label>
                    {status.id === statusID ? t(status.label) : t(status.label)[0]}
                  </label>
                </span>
              )
            })
          }
        </div>
        {
          readyOrders?.map(item =>
            renderOrderCard(item, type === EDriverTabs.Lite)
          )
        }
      </div>

      <Separator
        text={t(TRANSLATION.ORDERS_HISTORY)}
        active={showHistoryOrders}
        onClick={() => setShowHistoryOrders(prev => !prev)}
      />
      <div
        className={cn('driver-orders', { 'driver-orders--active': showHistoryOrders })}
      >
        {
          historyOrders?.map(item =>
            renderOrderCard(item, type === EDriverTabs.Lite)
          )
        }
      </div>

      {showBonusPanel && selectedOrderId && (
        <DeliveryBonus
          orderId={selectedOrderId}
          currentBonus={deliveryBonuses[selectedOrderId] || 0}
          onBonusChange={handleBonusChange}
          onClose={() => setShowBonusPanel(false)}
        />
      )}
    </PageSection>
  )
}

export default connector(DriverOrdersWithBonus)