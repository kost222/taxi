import 'core-js/features/object/assign'
import 'core-js/features/object/values'
import './utils/production-logger' // Initialize production logging
import React from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { HelmetProvider } from 'react-helmet-async'
import store from './state'
import App from './App'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import * as serviceWorker from './serviceWorker'
import './styles/global.scss'
import { setConfigLoaded } from './state/config/actionCreators'
import { hasWindowData, getWindowData } from './types/window'
import { logger } from './utils/logger'
logger.info('Application starting...')
logger.debug('window.data:', getWindowData())
// Set up callback for when data.js is loaded
window.dataLoadedCallback = () => {
  store.dispatch(setConfigLoaded())
}
// If data is already loaded, dispatch immediately
if (hasWindowData()) {
  store.dispatch(setConfigLoaded())
}
if(process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://8181d1719b4f41e0b4f6c2c8c449e0f7@o1155911.ingest.sentry.io/6236737',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.captureConsoleIntegration({
        levels: ['error'],
      }),
    ],
    tracesSampleRate: 1.0,
  })
}
const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Root element not found!</div>';
} else {
  createRoot(rootElement as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <Provider store={store}>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <HelmetProvider>
              <Sentry.ErrorBoundary>
                <App/>
              </Sentry.ErrorBoundary>
            </HelmetProvider>
          </LocalizationProvider>
        </Provider>
      </BrowserRouter>
    </React.StrictMode>,
  )
}
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register()
