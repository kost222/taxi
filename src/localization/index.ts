import store from '../state'
import CATEGORIES from './categories'
import TRANSLATION from './translation'
import { configSelectors } from '../state/config'

const errorsShown = new Set<string>()

interface IOptions {
  /** Does result.toLowerCase() */
  toLower?: boolean,
  /** Does result.toUpperCase() */
  toUpper?: boolean
}
/**
 * Gets localized text
 *
 * @param id CATEGORY.KEY or just KEY. Default category is lang_vls
 * @param options Result text modificators
 */
function t(id: string, options: IOptions = {}) {
  try {
    const splittedID = id.split('.')
    const category = splittedID.length === 2 ?
      splittedID[0] :
      CATEGORIES.LANG_VLS
    const key = splittedID[splittedID.length - 1]
    const language = configSelectors.language(store.getState())
    let result = ''
    const _data = (window as any).data
    if (!_data) {
      // Return a readable fallback instead of "Error"
      const fallbackText = key.replace(/_/g, ' ').toLowerCase()
      return fallbackText.charAt(0).toUpperCase() + fallbackText.slice(1)
    }
    const possibleCategories: string[] = Object.values(CATEGORIES)
    if (category === CATEGORIES.LANG_VLS) {
      if (_data[category] && _data[category][key]) {
        result = _data[category][key][language.id]
      }
    }
    else if (category === CATEGORIES.BOOKING_DRIVER_STATES && key === '0') {
      if (_data.lang_vls && _data.lang_vls.search) {
        result = _data.lang_vls.search[language.id]
      }
    }
    else if (possibleCategories.includes(category)) {
      if (_data[category] && _data[category][key]) {
        result = _data[category][key][language.iso]
      }
    }
    else
      throw new Error(`Unknown category ${category}`)
    if (!result) {
      // Return a readable fallback instead of throwing error
      const fallbackText = key.replace(/_/g, ' ').toLowerCase()
      result = fallbackText.charAt(0).toUpperCase() + fallbackText.slice(1)
    }
    if (options.toLower) {
      result = result.toLowerCase()
    }
    if (options.toUpper) {
      result = result.toUpperCase()
    }
    return result
  } catch (error) {
    if (!errorsShown.has(id)) {
      console.error(`Localization error for key: ${id}`, error)
      errorsShown.add(id)
    }
    // Return a readable fallback instead of "Error"
    const key = id.split('.').pop() || id
    const fallbackText = key.replace(/_/g, ' ').toLowerCase()
    return fallbackText.charAt(0).toUpperCase() + fallbackText.slice(1)
  }
}
export {
  t,
  TRANSLATION,
}