import { Record } from 'immutable'
import _ from 'lodash'
import { TAction } from '../../types'
import { calculateDistance } from '../../tools/maps'
import { ActionTypes, IOrdersState } from './constants'
import { mini_orders } from '../../constants/miniOrders'

// Заказы по дизайну Frame 26080049
const generateTestOrders = (count = 8) => {
  const designOrders = [
    {
      b_id: '1821',
      status: 'Search',
      b_estimate_waiting: '0:28',
      passengers: 1,
      b_amount: -47,
      currency: 'GHS',
      rating: 5
    },
    {
      b_id: '1823',
      status: 'Waiting',
      time: '1:06',
      passengers: 1,
      b_amount: -52,
      currency: 'GHS',
      rating: 4
    },
    {
      b_id: '1827',
      status: 'On the way',
      passengers: 1,
      b_amount: -102,
      currency: 'GHS',
      rating: 3
    },
    {
      b_id: '1829',
      status: 'Search',
      b_estimate_waiting: '0:15',
      passengers: 2,
      b_amount: -35,
      currency: 'GHS',
      rating: 5
    },
    {
      b_id: '1830',
      status: 'Waiting',
      time: '2:12',
      passengers: 1,
      b_amount: -78,
      currency: 'GHS',
      rating: 4
    },
    {
      b_id: '1831',
      status: 'On the way',
      passengers: 3,
      b_amount: -125,
      currency: 'GHS',
      rating: 5
    },
    {
      b_id: '1832',
      status: 'Search',
      b_estimate_waiting: '0:45',
      passengers: 1,
      b_amount: -64,
      currency: 'GHS',
      rating: 4
    },
    {
      b_id: '1833',
      status: 'Waiting',
      time: '0:32',
      passengers: 2,
      b_amount: -89,
      currency: 'GHS',
      rating: 3
    },
    {
      b_id: '1834',
      status: 'Search',
      b_estimate_waiting: '1:15',
      passengers: 1,
      b_amount: -55,
      currency: 'GHS',
      rating: 4
    },
    {
      b_id: '1835',
      status: 'On the way',
      passengers: 2,
      b_amount: -85,
      currency: 'GHS',
      rating: 5
    }
  ]

  return designOrders.slice(0, count).map(order => ({
    b_id: order.b_id,
    u_id: 'test_user',
    b_start_datetime: new Date(),
    b_passengers_count: order.passengers,
    b_car_class: 'economy',
    b_estimate_waiting: order.b_estimate_waiting || order.time,
    b_voting: false,
    drivers: order.status === 'Search' ? [] : [{ c_state: order.status === 'Waiting' ? 1 : 2 }],
    b_comments: [],
    b_amount: Math.abs(order.b_amount),
    b_max_waiting: 300,
    b_start_address: 'Test Address',
    b_destination_address: 'Test Destination',
    b_start_latitude: 0,
    b_start_longitude: 0,
    b_destination_latitude: 0,
    b_destination_longitude: 0,
    passengers: order.passengers,
    status: order.status,
    rating: order.rating,
    currency: order.currency
  }) as any)
}

export const ReducerRecord = Record<IOrdersState>({
  activeOrders: generateTestOrders(8),  // Добавили тестовые заказы для клиентов
  readyOrders: null,
  historyOrders: null,
  activeOrdersTakerGeolocation: undefined,
  readyOrdersTakerGeolocation: undefined,
  historyOrdersTakerGeolocation: undefined,
})

export default function reducer(state = new ReducerRecord(), action: TAction) {
  const { type, payload } = action

  switch (type) {
    case ActionTypes.GET_ACTIVE_ORDERS_SUCCESS:
      return _.isEqual(state.activeOrders, payload) ?
        state :
        state.set('activeOrders', payload)
    case ActionTypes.GET_ACTIVE_ORDERS_TAKER_GEOLOCATION_SUCCESS:
      return geolocationEqual(state.activeOrdersTakerGeolocation, payload) ?
        state :
        state.set('activeOrdersTakerGeolocation', payload)
    case ActionTypes.GET_READY_ORDERS_SUCCESS:
      return _.isEqual(state.readyOrders, payload) ?
        state :
        state.set('readyOrders', payload)
    case ActionTypes.GET_READY_ORDERS_TAKER_GEOLOCATION_SUCCESS:
      return geolocationEqual(state.readyOrdersTakerGeolocation, payload) ?
        state :
        state.set('readyOrdersTakerGeolocation', payload)
    case ActionTypes.GET_HISTORY_ORDERS_SUCCESS:
      return _.isEqual(state.historyOrders, payload) ?
        state :
        state.set('historyOrders', payload)
    case ActionTypes.GET_HISTORY_ORDERS_TAKER_GEOLOCATION_SUCCESS:
      return geolocationEqual(state.historyOrdersTakerGeolocation, payload) ?
        state :
        state.set('historyOrdersTakerGeolocation', payload)
    case ActionTypes.SET_ORDER_COUNT:
      return state.set('activeOrders', generateTestOrders(payload))
    case ActionTypes.CLEAR:
      return new ReducerRecord()
    default:
      return state
  }
}

const GEOLOCATION_CHANGE_THRESHOLD = 100
const geolocationEqual = (
  a?: [lat: number, lng: number],
  b?: [lat: number, lng: number],
): boolean => !!(
  a === b || (a && b && (
    (a[0] === b[0] && a[1] === b[1]) ||
    calculateDistance(a, b) < GEOLOCATION_CHANGE_THRESHOLD
  ))
)