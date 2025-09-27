import { IPoint } from '../types/types'
import SITE_CONSTANTS from '../siteConstants'

// Радиусы для определения класса локации (в километрах)
const CITY_RADIUS = 15 // В пределах 15 км - город
const SUBURB_RADIUS = 50 // От 15 до 50 км - пригород
// Более 50 км - межгород

// Координаты центров городов (можно расширить список)
const CITY_CENTERS: { [key: string]: { lat: number, lng: number, name: string } } = {
  moscow: { lat: 55.7558, lng: 37.6173, name: 'Москва' },
  spb: { lat: 59.9311, lng: 30.3609, name: 'Санкт-Петербург' },
  novosibirsk: { lat: 55.0084, lng: 82.9357, name: 'Новосибирск' },
  ekaterinburg: { lat: 56.8389, lng: 60.6057, name: 'Екатеринбург' },
  // Добавьте другие города по необходимости
}

// Функция для вычисления расстояния между двумя точками (формула Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Радиус Земли в километрах
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Найти ближайший город
function findNearestCity(point: IPoint): { city: string, distance: number } | null {
  let nearestCity = null
  let minDistance = Infinity

  Object.entries(CITY_CENTERS).forEach(([key, city]) => {
    const distance = calculateDistance(
      point.latitude,
      point.longitude,
      city.lat,
      city.lng
    )
    if (distance < minDistance) {
      minDistance = distance
      nearestCity = key
    }
  })

  return nearestCity ? { city: nearestCity, distance: minDistance } : null
}

// Определить класс локации по координатам
export function detectLocationClass(from: IPoint | null, to: IPoint | null): string {
  // Если нет точек, возвращаем дефолтный класс
  if (!from || !to) {
    return SITE_CONSTANTS.DEFAULT_BOOKING_LOCATION_CLASS
  }

  // Находим ближайшие города для обеих точек
  const fromCity = findNearestCity(from)
  const toCity = findNearestCity(to)

  if (!fromCity || !toCity) {
    return SITE_CONSTANTS.DEFAULT_BOOKING_LOCATION_CLASS
  }

  // Вычисляем расстояние между точками
  const tripDistance = calculateDistance(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude
  )

  // Определяем класс на основе расстояний
  const locationClasses = SITE_CONSTANTS.BOOKING_LOCATION_CLASSES

  // Если обе точки в пределах города (< 15 км от центра) и поездка короткая
  if (fromCity.distance < CITY_RADIUS && toCity.distance < CITY_RADIUS && tripDistance < CITY_RADIUS) {
    // Город
    const cityClass = locationClasses.find(lc =>
      lc.name?.toLowerCase().includes('город') ||
      lc.name?.toLowerCase().includes('city') ||
      lc.id === '1'
    )
    if (cityClass) return cityClass.id
  }

  // Если одна из точек в пригороде (15-50 км) или поездка средней длины
  if ((fromCity.distance < SUBURB_RADIUS && toCity.distance < SUBURB_RADIUS) &&
      (tripDistance < SUBURB_RADIUS)) {
    // Пригород
    const suburbClass = locationClasses.find(lc =>
      lc.name?.toLowerCase().includes('пригород') ||
      lc.name?.toLowerCase().includes('suburb') ||
      lc.id === '2'
    )
    if (suburbClass) return suburbClass.id
  }

  // Если расстояние большое или точки в разных городах
  if (tripDistance > SUBURB_RADIUS || fromCity.city !== toCity.city) {
    // Межгород
    const intercityClass = locationClasses.find(lc =>
      lc.name?.toLowerCase().includes('межгород') ||
      lc.name?.toLowerCase().includes('intercity') ||
      lc.id === '3'
    )
    if (intercityClass) return intercityClass.id
  }

  return SITE_CONSTANTS.DEFAULT_BOOKING_LOCATION_CLASS
}

// Функция для автоматического обновления класса локации
export function shouldAutoUpdateLocationClass(from: IPoint | null, to: IPoint | null): boolean {
  // Автоматически обновляем только если есть обе точки
  return !!(from && to && from.latitude && from.longitude && to.latitude && to.longitude)
}

// Получить название класса локации
export function getLocationClassName(locationClassId: string): string {
  const locationClass = SITE_CONSTANTS.BOOKING_LOCATION_CLASSES.find(
    lc => lc.id === locationClassId
  )
  return locationClass?.name || ''
}