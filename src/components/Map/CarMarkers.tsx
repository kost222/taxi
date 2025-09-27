// Task 22: Show cars on the map
import React, { useEffect, useState } from 'react'
import { Marker, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useInterval } from '../../tools/hooks'
import * as API from '../../API'
export interface INearbyDriver {
  id: string
  name: string
  carModel: string
  carNumber: string
  rating: number
  lat: number
  lng: number
  status: 'available' | 'busy' | 'offline'
  carClass: string
  distance?: number // meters from user
  eta?: number // estimated time of arrival in minutes
}
interface ICarMarkersProps {
  userLocation?: { lat: number, lng: number }
  showOnlyAvailable?: boolean
  carClass?: string
  maxDistance?: number // Maximum distance in meters to show cars
}
// Create custom car icons for different classes
const createCarIcon = (carClass: string, status: string) => {
  const colorMap: Record<string, string> = {
    available: '#22c55e',
    busy: '#f59e0b',
    offline: '#9ca3af'
  }
  const carEmoji = {
    economy: '🚗',
    comfort: '🚙',
    'comfort+': '🚘',
    business: '🚖',
    minivan: '🚐',
    suv: '🚙',
    premium: '🏎️'
  }[carClass] || '🚗'
  const color = colorMap[status] || colorMap.offline
  return L.divIcon({
    html: `
      <div class="car-marker car-marker--${status}" style="background-color: ${color}">
        <span class="car-emoji">${carEmoji}</span>
      </div>
    `,
    className: 'custom-car-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}
const CarMarkers: React.FC<ICarMarkersProps> = ({
  userLocation,
  showOnlyAvailable = false,
  carClass,
  maxDistance = 5000 // 5km by default
}) => {
  const [nearbyDrivers, setNearbyDrivers] = useState<INearbyDriver[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fetchNearbyDrivers = async () => {
    if (!userLocation) return
    try {
      setIsLoading(true)
      // Simulate API call to fetch nearby drivers
      // In real implementation, this would call your backend
      const mockDrivers: INearbyDriver[] = generateMockDrivers(userLocation, 15)
      // Filter drivers based on criteria
      let filteredDrivers = mockDrivers
      if (showOnlyAvailable) {
        filteredDrivers = filteredDrivers.filter(d => d.status === 'available')
      }
      if (carClass) {
        filteredDrivers = filteredDrivers.filter(d => d.carClass === carClass)
      }
      if (maxDistance) {
        filteredDrivers = filteredDrivers.filter(d => (d.distance || 0) <= maxDistance)
      }
      setNearbyDrivers(filteredDrivers)
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }
  // Fetch drivers on mount and when location changes
  useEffect(() => {
    fetchNearbyDrivers()
  }, [userLocation, showOnlyAvailable, carClass])
  // Update driver positions every 10 seconds
  useInterval(() => {
    fetchNearbyDrivers()
  }, 10000)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} м`
    } else {
      return `${(meters / 1000).toFixed(1)} км`
    }
  }
  const formatETA = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} мин`
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = Math.round(minutes % 60)
      return `${hours}ч ${mins}м`
    }
  }
  return (
    <>
      {nearbyDrivers.map(driver => (
        <Marker
          key={driver.id}
          position={[driver.lat, driver.lng]}
          icon={createCarIcon(driver.carClass, driver.status)}
        >
          <Popup className="car-popup">
            <div className="car-popup__content">
              <div className="car-popup__header">
                <strong>{driver.name}</strong>
                <span className="rating">⭐ {driver.rating.toFixed(1)}</span>
              </div>
              <div className="car-popup__details">
                <p>{driver.carModel}</p>
                <p className="car-number">{driver.carNumber}</p>
                <p className="car-class">{getCarClassName(driver.carClass)}</p>
              </div>
              <div className="car-popup__stats">
                {driver.distance && (
                  <div className="stat">
                    <span className="label">Расстояние:</span>
                    <span className="value">{formatDistance(driver.distance)}</span>
                  </div>
                )}
                {driver.eta && driver.status === 'available' && (
                  <div className="stat">
                    <span className="label">Прибытие:</span>
                    <span className="value">{formatETA(driver.eta)}</span>
                  </div>
                )}
                <div className="stat">
                  <span className="label">Статус:</span>
                  <span className={`value status-${driver.status}`}>
                    {getStatusName(driver.status)}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
          <Tooltip permanent={false} direction="top" offset={[0, -30]}>
            {driver.status === 'available'
              ? `${driver.carModel} • ${formatETA(driver.eta || 0)}`
              : getStatusName(driver.status)
            }
          </Tooltip>
        </Marker>
      ))}
      {/* Add styles for car markers */}
      <style>{`
        .custom-car-marker {
          background: none !important;
          border: none !important;
        }
        .car-marker {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          position: relative;
          animation: pulse 2s infinite;
        }
        .car-marker--available {
          animation: pulse-available 2s infinite;
        }
        .car-marker--busy {
          animation: pulse-busy 2s infinite;
        }
        @keyframes pulse-available {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        @keyframes pulse-busy {
          0% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(245, 158, 11, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
          }
        }
        .car-emoji {
          font-size: 20px;
        }
        .car-popup__content {
          min-width: 200px;
        }
        .car-popup__header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        .car-popup__details p {
          margin: 4px 0;
          font-size: 14px;
        }
        .car-number {
          font-weight: 600;
          color: #1f2937;
        }
        .car-class {
          color: #6b7280;
          font-style: italic;
        }
        .car-popup__stats {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }
        .car-popup__stats .stat {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
          font-size: 13px;
        }
        .car-popup__stats .label {
          color: #6b7280;
        }
        .car-popup__stats .value {
          font-weight: 500;
        }
        .status-available {
          color: #16a34a;
        }
        .status-busy {
          color: #d97706;
        }
        .status-offline {
          color: #6b7280;
        }
        .rating {
          color: #f59e0b;
          font-weight: 600;
        }
      `}</style>
    </>
  )
}
// Helper functions
const getCarClassName = (carClass: string): string => {
  const classNames: Record<string, string> = {
    economy: 'Эконом',
    comfort: 'Комфорт',
    'comfort+': 'Комфорт+',
    business: 'Бизнес',
    minivan: 'Минивэн',
    suv: 'Внедорожник',
    premium: 'Премиум'
  }
  return classNames[carClass] || carClass
}
const getStatusName = (status: string): string => {
  const statusNames: Record<string, string> = {
    available: 'Доступен',
    busy: 'Занят',
    offline: 'Оффлайн'
  }
  return statusNames[status] || status
}
// Mock data generator for testing
const generateMockDrivers = (userLocation: { lat: number, lng: number }, count: number): INearbyDriver[] => {
  const carClasses = ['economy', 'comfort', 'comfort+', 'business', 'minivan']
  const statuses = ['available', 'busy', 'offline'] as const
  const names = ['Александр', 'Михаил', 'Сергей', 'Андрей', 'Дмитрий', 'Иван', 'Николай', 'Владимир']
  const carModels = ['Toyota Camry', 'Hyundai Solaris', 'Kia Rio', 'Volkswagen Polo', 'Skoda Rapid', 'Mercedes E-Class']
  const drivers: INearbyDriver[] = []
  for (let i = 0; i < count; i++) {
    // Generate random position within ~5km of user
    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * 5000 // up to 5km
    const deltaLat = (distance / 111320) * Math.cos(angle)
    const deltaLng = (distance / (111320 * Math.cos(userLocation.lat * Math.PI / 180))) * Math.sin(angle)
    const driver: INearbyDriver = {
      id: `driver-${i + 1}`,
      name: names[Math.floor(Math.random() * names.length)],
      carModel: carModels[Math.floor(Math.random() * carModels.length)],
      carNumber: `А${Math.floor(Math.random() * 900) + 100}ВС${Math.floor(Math.random() * 900) + 100}`,
      rating: 4 + Math.random() * 1,
      lat: userLocation.lat + deltaLat,
      lng: userLocation.lng + deltaLng,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      carClass: carClasses[Math.floor(Math.random() * carClasses.length)],
      distance: distance,
      eta: Math.round(distance / 500 + Math.random() * 5) // rough ETA calculation
    }
    drivers.push(driver)
  }
  return drivers
}
export default CarMarkers