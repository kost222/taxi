// Timeout and duration constants

export const TIMEOUTS = {
  // API and connection timeouts
  CHAT_SERVER_ACTIVATION: 30000, // 30 seconds
  WEBSOCKET_RECONNECT: 5000, // 5 seconds

  // UI interaction timeouts
  NOTIFICATION_DURATION: 5000, // 5 seconds
  ERROR_NOTIFICATION_DURATION: 8000, // 8 seconds
  SCROLL_END_DETECTION: 150, // 150ms
  CLICK_ACTIVE_DURATION: 5000, // 5 seconds
  MAP_UPDATE_DELAY: 5000, // 5 seconds

  // Auction system
  AUCTION_BID_INTERVAL_MIN: 3000, // 3 seconds
  AUCTION_BID_INTERVAL_RANDOM: 5000, // + random up to 5 seconds
  AUCTION_DURATION_MULTIPLIER: 60000, // Convert minutes to milliseconds

  // Version check
  VERSION_CHECK_THRESHOLD: 500, // 500ms

  // Auto-trigger timeouts
  HEADER_MENU_AUTO_CLOSE: 7000, // 7 seconds
  AUTO_BID_DELAY: 500, // 500ms
  AUTO_BID_RANDOM_DELAY: 1000, // + random up to 1 second
} as const

export const RATIOS = {
  // Pricing ratios
  MIN_BID_RATIO: 0.7, // 30% discount (70% of original price)
  AUTO_ACCEPT_RATIO: 0.7, // Same as min bid ratio

  // UI opacity
  DISABLED_OPACITY: 0.7,
} as const

export const DISTANCES = {
  // Map distances in meters
  MAX_CAR_DISTANCE: 5000, // 5km
  MOCK_CAR_MAX_DISTANCE: 5000, // 5km for mock data
} as const