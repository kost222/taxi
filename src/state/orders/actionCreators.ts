import { TAction } from '../../types/index'
import { ActionTypes } from './constants'

export const getActiveOrders = (payload: GetOrdersParams = {}): TAction => {
  return { type: ActionTypes.GET_ACTIVE_ORDERS_REQUEST, payload }
}

export const getReadyOrders = (payload: GetOrdersParams = {}): TAction => {
  return { type: ActionTypes.GET_READY_ORDERS_REQUEST, payload }
}

export const getHistoryOrders = (payload: GetOrdersParams = {}): TAction => {
  return { type: ActionTypes.GET_HISTORY_ORDERS_REQUEST, payload }
}

export interface GetOrdersParams {
  estimate?: boolean
}

export const clearOrders = (): TAction => {
  return { type: ActionTypes.CLEAR }
}

export const setOrderCount = (count: number): TAction => {
  return { type: ActionTypes.SET_ORDER_COUNT, payload: count }
}

export interface ReviewData {
  orderId: string
  rating: number
  driverRating: number
  carRating: number
  comment: string
}

export const submitReview = (payload: ReviewData): TAction => {
  return { type: ActionTypes.SUBMIT_REVIEW, payload }
}