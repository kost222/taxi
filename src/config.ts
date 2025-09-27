import store from './state'
import { setConfigError, setConfigLoaded } from './state/config/actionCreators'
import { DEFAULT_CONFIG_NAME } from './constants'

let _configName: string

// Secure configuration loading without script injection
const loadConfiguration = async (configName?: string): Promise<void> => {
  try {
    // Try to load local configuration first
    const configData = await fetch('/data.js')
    if (configData.ok) {
      // Configuration is handled via static file - no dynamic script injection needed
      store.dispatch(setConfigLoaded())
      return
    }

    // Fallback: load from configured server URL if local file not available
    const serverUrl = process.env.REACT_APP_SERVER_BASE_URL
    if (serverUrl) {
      const name = configName ? `data_${configName}.js` : 'data.js'
      const fallbackUrl = `${serverUrl}/cache/${name}`
      const fallbackResponse = await fetch(fallbackUrl)

      if (fallbackResponse.ok) {
        store.dispatch(setConfigLoaded())
        return
      }
    }

    // If both methods fail, dispatch error
    store.dispatch(setConfigError())
  } catch (error) {
    store.dispatch(setConfigError())
  }
}

class Config {
  constructor() {
    const params = new URLSearchParams(window.location.search)
    const configParam = params.get('config')
    const clearConfigParam = params.get('clearConfig') !== null

    if (clearConfigParam) {
      this.clearConfig()
    } else if (configParam) {
      this.setConfig(configParam)
    } else {
      const savedConfig = this.SavedConfig
      if (savedConfig) {
        this.setConfig(savedConfig)
      } else {
        this.setDefaultName()
      }
    }

    // Clean up URL parameters
    if (configParam || clearConfigParam) {
      if (configParam) params.delete('config')
      if (clearConfigParam) params.delete('clearConfig')

      const cleanUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)
    }
  }

  setConfig(name: string) {
    localStorage.setItem('config', name)
    _configName = name
    loadConfiguration(name)
  }

  clearConfig() {
    localStorage.removeItem('config')
    _configName = ''
    loadConfiguration()
  }

  setDefaultName() {
    loadConfiguration()
  }

  get API_URL(): string {
    // Get API URL from environment variable or use server URL as fallback
    const apiUrl = process.env.REACT_APP_API_URL
    if (apiUrl) {
      return apiUrl
    }
    return `${this.SERVER_URL}/api/v1`
  }

  get SERVER_URL(): string {
    // Get server URL from environment variable with fallback
    const baseUrl = process.env.REACT_APP_SERVER_BASE_URL
    if (baseUrl) {
      return `${baseUrl}/c/${_configName || DEFAULT_CONFIG_NAME}`
    }

    // Fallback to a generic server URL (customers will configure this)
    return `https://your-taxi-backend.com/c/${_configName || DEFAULT_CONFIG_NAME}`
  }

  get SavedConfig(): string | null {
    return localStorage.getItem('config')
  }
}

const config = new Config()

export default config