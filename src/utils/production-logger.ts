// Production-safe logger that completely removes console statements in production builds

export const productionLogger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args)
    }
  },

  error: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(...args)
    } else {
      // In production, only log critical errors
      console.error('Application error occurred')
    }
  },

  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args)
    }
  },

  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(...args)
    }
  },

  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.debug(...args)
    }
  }
}

// Global replacement for console in production
if (process.env.NODE_ENV === 'production') {
  // Override global console in production to prevent any leaks
  global.console = {
    ...console,
    log: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: (message: string) => {
      // Only log generic error message in production
      console.error('Application error occurred')
    }
  } as any
}