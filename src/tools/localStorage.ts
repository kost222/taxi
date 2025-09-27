import { handleError, ErrorCode } from '../utils/errorHandler'

export function getItem<T>(
  key: string,
  defaultValue?: T,
  allowableValues?: T[],
): T {
  defaultValue = (
    defaultValue === undefined ?
      allowableValues && allowableValues[0] :
      defaultValue
  ) as T
  let value
  try {
    value = localStorage.getItem(key)
    value = value !== null ? JSON.parse(value) : defaultValue
  } catch (error) {
    handleError(error, `localStorage getItem(${key})`)
    value = defaultValue
  }
  return allowableValues ?
    allowableValues.includes(value) ?
      value :
      defaultValue :
    value ?? defaultValue
}

export function setItem<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    handleError(error, `localStorage setItem(${key})`)
  }
}

export function removeItem(key: string) {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    handleError(error, `localStorage removeItem(${key})`)
  }
}