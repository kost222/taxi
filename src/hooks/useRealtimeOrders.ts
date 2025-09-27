import { useEffect, useRef, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import config from '../config'
interface IRealtimeConfig {
  onOrderUpdate?: (order: any) => void
  onOrderCreate?: (order: any) => void
  onOrderDelete?: (orderId: string) => void
  reconnectInterval?: number
}
export const useRealtimeOrders = (userId: string, config?: IRealtimeConfig) => {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectedRef = useRef(false)
  const reconnectInterval = config?.reconnectInterval || 5000
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }
    // Use local WebSocket for development
    // Get WebSocket URL from environment or use default
    const wsUrl = process.env.REACT_APP_WS_URL
      ? `${process.env.REACT_APP_WS_URL}/ws/orders?userId=${userId}`
      : window.location.hostname === 'localhost'
        ? `ws://localhost:8080/ws/orders?userId=${userId}`
        : `wss://${window.location.host}/ws/orders?userId=${userId}`
    try {
      wsRef.current = new WebSocket(wsUrl)
      wsRef.current.onopen = () => {
        isConnectedRef.current = true
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          switch (data.type) {
            case 'ORDER_UPDATE':
              config?.onOrderUpdate?.(data.order)
              break
            case 'ORDER_CREATE':
              config?.onOrderCreate?.(data.order)
              break
            case 'ORDER_DELETE':
              config?.onOrderDelete?.(data.orderId)
              break
            case 'PING':
              wsRef.current?.send(JSON.stringify({ type: 'PONG' }))
              break
            default:
          }
        } catch (error) {
        }
      }
      wsRef.current.onerror = (error) => {
        isConnectedRef.current = false
      }
      wsRef.current.onclose = () => {
        isConnectedRef.current = false
        // Auto-reconnect
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null
            connect()
          }, reconnectInterval)
        }
      }
    } catch (error) {
    }
  }, [userId, config, reconnectInterval])
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    isConnectedRef.current = false
  }, [])
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
    }
  }, [])
  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])
  return {
    isConnected: isConnectedRef.current,
    sendMessage,
    reconnect: connect,
    disconnect
  }
}