// Window type extensions for taxi app

interface SiteConstant {
  value?: string
  [key: string]: any
}

interface SiteConstants {
  def_maska_tel?: SiteConstant
  form_profile?: SiteConstant
  form_register?: SiteConstant
  reg_driver?: SiteConstant
  [key: string]: any
}

interface Language {
  iso: string
  [key: string]: any
}

interface TaxiAppData {
  car_classes?: any
  booking_comments?: any
  booking_location_classes?: any
  langs?: Record<string, Language>
  site_constants?: SiteConstants
  cities?: Record<string, Record<string, string>>
  [key: string]: any
}

interface ReactNativeWebView {
  postMessage: (message: string) => void
}

declare global {
  interface Window {
    data?: TaxiAppData
    default_lang?: string
    ReactNativeWebView?: ReactNativeWebView
    preloader?: HTMLElement
    dataLoadedCallback?: () => void
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: any
  }
}

// Type guards for window properties
export const hasWindowData = (): boolean => {
  return typeof window !== 'undefined' && window.data !== undefined
}

export const hasReactNativeWebView = (): boolean => {
  return typeof window !== 'undefined' && window.ReactNativeWebView !== undefined
}

export const hasReduxDevTools = (): boolean => {
  return typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ !== undefined
}

export const hasPreloader = (): boolean => {
  return typeof window !== 'undefined' && window.preloader !== undefined
}

// Safe getters for window data
export const getWindowData = (): TaxiAppData | null | undefined => {
  return hasWindowData() ? window.data : null
}

export const getSiteConstant = (key: string): string | undefined => {
  const data = getWindowData()
  return data?.site_constants?.[key]?.value
}

export const getPhoneMask = (): string => {
  return getSiteConstant('def_maska_tel') || '+34(___)___-___-___'
}

export const getLanguages = () => {
  const data = getWindowData()
  return data?.langs || {}
}

export const getCities = () => {
  const data = getWindowData()
  return data?.cities || {}
}

export const getDefaultLang = (): string => {
  return window.default_lang || 'en'
}