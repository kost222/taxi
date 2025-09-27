import React, { useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import AppRoutes from './Routes'
import Theme from './components/Theme'
import CancelOrderModal from './components/modals/CancelModal'
import TimerModal from './components/modals/PickTimeModal'
import CommentsModal from './components/modals/CommentsModal'
import DriverModal from './components/modals/DriverModal'
import RatingModal from './components/modals/RatingModal'
import OnTheWayModal from './components/modals/OnTheWayModal'
import TieCardModal from './components/modals/TieCardModal'
import CardDetailsModal from './components/modals/CardDetailsModal'
import VoteModal from './components/modals/VoteModal'
import PlaceModal from './components/modals/SeatsModal'
import LoginModal from './components/modals/login'
import AlarmModal from './components/modals/AlarmModal'
import MapModal from './components/modals/MapModal'
import TakePassengerModal from './components/modals/TakePassengerModal'
import CancelDriverOrderModal from './components/modals/DriverCancelModal'
import ProfileModal from './components/modals/ProfileModal'
import CandidatesModal from './components/modals/CandidatesModal'
import MessageModal from './components/modals/MessageModal'
import SITE_CONSTANTS from './siteConstants'
import { hasReactNativeWebView } from './types/window'
import { TIMEOUTS } from './constants/timeouts'
import { Helmet } from 'react-helmet-async'
import { configSelectors } from './state/config'
import { userActionCreators, userSelectors } from './state/user'
import './App.scss'
import { IRootState } from './state'
import { logger } from './utils/logger'
import * as API from './API'
import { modalsSelectors } from './state/modals'
import Chat from './components/Chat'
import WACodeModal from './components/modals/login/WACodeModal'
import RefCodeModal from './components/modals/login/RefCodeModal'

const mapStateToProps = (state: IRootState) => ({
  language: configSelectors.language(state),
  configStatus: configSelectors.status(state),
  activeChat: modalsSelectors.activeChat(state),
  user: userSelectors.user(state),
})

const mapDispatchToProps = {
  initUser: userActionCreators.initUser,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
}

const App: React.FC<IProps> = ({
  language,
  activeChat,
  user,
  configStatus,
  initUser,
}) => {
  if (hasReactNativeWebView() && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'SYSTEM', message: 'START' }),
    )
  }

  useEffect(() => {
    initUser()

    API.activateChatServer()
    const interval = setInterval(() => API.activateChatServer(), TIMEOUTS.CHAT_SERVER_ACTIVATION)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const getMetaTags = () => {
    let _domain = `${window.location.protocol}//${window.location.host}/`

    return (
      <Helmet>
        {SITE_CONSTANTS.OG_IMAGE && (
          <meta property="og:image" content={_domain + SITE_CONSTANTS.OG_IMAGE} />
        )}
        {SITE_CONSTANTS.TW_IMAGE && (
          <meta
            property="twitter:image"
            content={_domain + SITE_CONSTANTS.TW_IMAGE}
          />
        )}
        <style>{`
          .colored {
            color: ${SITE_CONSTANTS.PALETTE?.primary?.dark || '#FF4444'}
          }

          section details summary {
            color: ${SITE_CONSTANTS.PALETTE?.primary?.dark || '#FF4444'};
          }
          section details summary::after {
            border-top: 10px solid ${SITE_CONSTANTS.PALETTE?.primary?.main || '#FF4444'};
          }

          .modal .active {
            color: ${SITE_CONSTANTS.PALETTE?.primary?.dark || '#FF4444'}
          }
          .modal form fieldset h3, .modal form fieldset h4 {
            color: ${SITE_CONSTANTS.PALETTE?.primary?.dark || '#FF4444'}
          }

          .phone-link {
            border-bottom: 1px solid ${SITE_CONSTANTS.PALETTE?.primary?.light || '#FF6B6B'};
          }
          .phone-link:hover {
            border-bottom-color: ${SITE_CONSTANTS.PALETTE?.primary?.dark || '#FF4444'};
          }
        `}</style>
      </Helmet>
    )
  }

  logger.debug('App component initialized', { language: language?.id, configStatus })

  return (
    <React.Fragment key={`${language?.id || 'en'}_${configStatus}`}>
      <Theme>
        {getMetaTags()}
        <AppRoutes />
        {/* <PositionTracker/> */}
        <VoteModal />
        <TimerModal />
        <CommentsModal />
        <DriverModal />
        <OnTheWayModal />
        <CancelOrderModal />
        <RatingModal />
        <TieCardModal />
        <CardDetailsModal />
        <WACodeModal />
        <RefCodeModal />
        <PlaceModal />
        <AlarmModal />
        <TakePassengerModal />
        <CancelDriverOrderModal />
        <MapModal />
        <LoginModal />
        <CandidatesModal />
        {user && <ProfileModal />}
        {activeChat && <Chat key={activeChat} />}
        <MessageModal />
      </Theme>
    </React.Fragment>
  )
}

export default connector(App)