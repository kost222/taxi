import React, { useState, useEffect, useCallback } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { t, TRANSLATION } from '../../../localization'
import { IRootState } from '../../../state'
import { modalsActionCreators, modalsSelectors } from '../../../state/modals'
import { ordersSelectors } from '../../../state/orders'
import { IOrder } from '../../../types/types'
import './styles.scss'

const mapStateToProps = (state: IRootState) => ({
  isBoardingCodeModalOpen: modalsSelectors.isBoardingCodeModalOpen(state),
  orderId: modalsSelectors.boardingCodeOrderId(state),
  activeOrders: ordersSelectors.activeOrders(state),
})

const mapDispatchToProps = {
  setBoardingCodeModal: modalsActionCreators.setBoardingCodeModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {}

const BoardingCodeModal: React.FC<IProps> = ({
  isBoardingCodeModalOpen,
  orderId,
  activeOrders,
  setBoardingCodeModal,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Найти заказ по ID
  const order: IOrder | undefined = activeOrders?.find(o => o.b_id === orderId)
  const boardingCode = order?.b_driver_code || '0000'

  // Обработчик полноэкранного режима
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      const elem = document.documentElement
      if (elem.requestFullscreen) {
        elem.requestFullscreen()
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen()
      } else if ((elem as any).mozRequestFullScreen) {
        (elem as any).mozRequestFullScreen()
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen()
      }
      setIsFullscreen(false)
    }
  }, [isFullscreen])

  // Слушаем изменения полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  const handleClose = useCallback(() => {
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setBoardingCodeModal({ isOpen: false, orderId: null })
  }, [isFullscreen, setBoardingCodeModal])

  if (!isBoardingCodeModalOpen) return null

  return (
    <div className={`boarding-code-modal ${isFullscreen ? 'boarding-code-modal--fullscreen' : ''}`}>
      <div className="boarding-code-modal__overlay" onClick={handleClose} />

      <div className="boarding-code-modal__content">
        <div className="boarding-code-modal__header">
          <h2 className="boarding-code-modal__title">
            {t(TRANSLATION.BOARDING_CODE) || 'Код посадки'}
          </h2>
          <div className="boarding-code-modal__actions">
            <button
              className="boarding-code-modal__fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
            >
              {isFullscreen ? '⛶' : '⛶'}
            </button>
            <button
              className="boarding-code-modal__close"
              onClick={handleClose}
            >
              ×
            </button>
          </div>
        </div>

        <div className="boarding-code-modal__body">
          <div className="boarding-code-modal__code-wrapper">
            <div className="boarding-code-modal__code">
              {boardingCode.split('').map((digit, index) => (
                <span key={index} className="boarding-code-modal__digit">
                  {digit}
                </span>
              ))}
            </div>
            <p className="boarding-code-modal__hint">
              {t(TRANSLATION.SHOW_CODE_TO_DRIVER) || 'Покажите этот код водителю'}
            </p>
          </div>

          {order && (
            <div className="boarding-code-modal__order-info">
              <div className="boarding-code-modal__info-item">
                <span className="boarding-code-modal__info-label">
                  {t(TRANSLATION.ORDER_NUMBER) || 'Номер заказа'}:
                </span>
                <span className="boarding-code-modal__info-value">
                  №{order.b_id}
                </span>
              </div>

              {order.drivers?.[0] && (
                <>
                  <div className="boarding-code-modal__info-item">
                    <span className="boarding-code-modal__info-label">
                      {t(TRANSLATION.DRIVER) || 'Водитель'}:
                    </span>
                    <span className="boarding-code-modal__info-value">
                      {order.drivers[0].u_name}
                    </span>
                  </div>

                  <div className="boarding-code-modal__info-item">
                    <span className="boarding-code-modal__info-label">
                      {t(TRANSLATION.CAR) || 'Автомобиль'}:
                    </span>
                    <span className="boarding-code-modal__info-value">
                      {order.drivers[0].cc_mark} {order.drivers[0].cc_color}
                    </span>
                  </div>

                  <div className="boarding-code-modal__info-item">
                    <span className="boarding-code-modal__info-label">
                      {t(TRANSLATION.LICENSE_PLATE) || 'Номер'}:
                    </span>
                    <span className="boarding-code-modal__info-value">
                      {order.drivers[0].cc_number}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {isFullscreen && (
          <div className="boarding-code-modal__fullscreen-hint">
            {t(TRANSLATION.PRESS_ESC_TO_EXIT) || 'Нажмите ESC для выхода из полноэкранного режима'}
          </div>
        )}
      </div>
    </div>
  )
}

export default connector(BoardingCodeModal)