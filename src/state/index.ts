import { createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from '@redux-devtools/extension'
import createSagaMiddleware from 'redux-saga'
import rootSaga from './rootSaga'
import { hasReduxDevTools } from '../types/window'

import rootReducer from './rootReducer'

const sagaMiddleware = createSagaMiddleware()
const configureStore = () => {
  const composeEnhancers =
    (
      hasReduxDevTools() &&
      window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ trace: true, traceLimit: 25 })
    ) ||
    composeWithDevTools
  const store = createStore(
    rootReducer,
    composeEnhancers(
      applyMiddleware(sagaMiddleware),
    ),
  )

  sagaMiddleware.run(rootSaga)

  return store
}

const store = configureStore()

export default store

export type IRootState = ReturnType<typeof store.getState>
