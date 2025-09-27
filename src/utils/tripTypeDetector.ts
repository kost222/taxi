export enum ETripType {
  City = 'city',
  Suburb = 'suburb',
  Intercity = 'intercity'
}

export interface ICoordinates {
  lat: number
  lng: number
}

export interface ITripTypeResult {
  type: ETripType
  distance: number
  availableCarClasses: string[]
}

// Рассчитать расстояние между двумя точками по координатам
function calculateDistance(from: ICoordinates, to: ICoordinates): number {
  const R = 6371 // Радиус Земли в км
  const dLat = (to.lat - from.lat) * Math.PI / 180
  const dLng = (to.lng - from.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Определить тип поездки на основе координат
export function detectTripType(from: ICoordinates, to?: ICoordinates): ITripTypeResult {
  // Если нет конечной точки, считаем городской поездкой по умолчанию
  if (!to) {
    return {
      type: ETripType.City,
      distance: 0,
      availableCarClasses: ['economy', 'comfort', 'business']
    }
  }

  const distance = calculateDistance(from, to)

  // Определяем тип поездки по расстоянию
  let type: ETripType
  let availableCarClasses: string[]

  if (distance <= 25) {
    // Город - до 25 км
    type = ETripType.City
    availableCarClasses = ['economy', 'comfort', 'comfort+', 'business', 'minivan']
  } else if (distance <= 50) {
    // Пригород - 25-50 км
    type = ETripType.Suburb
    availableCarClasses = ['economy', 'comfort', 'comfort+', 'business', 'minivan', 'suv']
  } else {
    // Межгород - более 50 км
    type = ETripType.Intercity
    availableCarClasses = ['comfort', 'comfort+', 'business', 'minivan', 'suv', 'premium']
  }

  return {
    type,
    distance: Math.round(distance * 10) / 10,
    availableCarClasses
  }
}

// Проверить находятся ли координаты в пределах города
export function isWithinCityBounds(coordinates: ICoordinates, cityCenter: ICoordinates, radiusKm: number = 30): boolean {
  const distance = calculateDistance(coordinates, cityCenter)
  return distance <= radiusKm
}

// Получить список доступных классов авто для типа поездки
export function getCarClassesForTripType(tripType: ETripType): string[] {
  switch (tripType) {
    case ETripType.City:
      return ['economy', 'comfort', 'comfort+', 'business', 'minivan']
    case ETripType.Suburb:
      return ['economy', 'comfort', 'comfort+', 'business', 'minivan', 'suv']
    case ETripType.Intercity:
      return ['comfort', 'comfort+', 'business', 'minivan', 'suv', 'premium']
    default:
      return ['economy', 'comfort']
  }
}

// Позволить юзеру вручную установить тип поездки если нет координат
export function setManualTripType(type: ETripType): ITripTypeResult {
  return {
    type,
    distance: 0,
    availableCarClasses: getCarClassesForTripType(type)
  }
}