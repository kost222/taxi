import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './styles.scss'

interface MapFixedProps {
  center?: [number, number]
  zoom?: number
  markers?: Array<{
    id: string
    lat: number
    lng: number
    type?: 'order' | 'vehicle' | 'assigned'
    popup?: string
  }>
  onMapClick?: (lat: number, lng: number) => void
}

const MapFixed: React.FC<MapFixedProps> = ({
  center = [55.7558, 37.6173], // Москва по умолчанию
  zoom = 13,
  markers = [],
  onMapClick
}) => {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Инициализация карты
    const isMobile = window.innerWidth < 768

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: !isMobile // Убираем контролы зума на мобильных (задача 9б)
    })

    // Добавляем тайлы OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    // Скрываем лого Leaflet визуально (задача 9)
    const style = document.createElement('style')
    style.textContent = `
      .leaflet-control-attribution {
        display: none !important;
      }
      .leaflet-control-zoom {
        ${isMobile ? 'display: none !important;' : ''}
      }
    `
    document.head.appendChild(style)

    // Добавляем скрытый блок для screen readers
    const srOnly = document.createElement('div')
    srOnly.className = 'sr-only'
    srOnly.setAttribute('aria-label', 'Map powered by OpenStreetMap contributors')
    srOnly.textContent = '© OpenStreetMap contributors'
    mapContainerRef.current.appendChild(srOnly)

    // Фикс уезжающего маркера (задача 7)
    const fixMarkerPositions = () => {
      markersRef.current.forEach((marker, id) => {
        const markerData = markers.find(m => m.id === id)
        if (markerData) {
          marker.setLatLng([markerData.lat, markerData.lng])
        }
      })
    }

    map.on('moveend', fixMarkerPositions)
    map.on('zoomend', fixMarkerPositions)

    // Обработка кликов по карте
    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      })
    }

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      style.remove()
    }
  }, [])

  // Обновление маркеров
  useEffect(() => {
    if (!mapRef.current) return

    // Удаляем старые маркеры
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current.clear()

    // Добавляем новые маркеры
    markers.forEach(markerData => {
      const icon = L.divIcon({
        className: `map-marker map-marker--${markerData.type || 'order'}`,
        html: `
          <div class="map-marker__icon">
            ${markerData.type === 'vehicle' ? '🚗' :
              markerData.type === 'assigned' ? '🚖' : '📍'}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })

      const marker = L.marker([markerData.lat, markerData.lng], { icon })
        .addTo(mapRef.current!)

      if (markerData.popup) {
        // Компактный хинт (задача 8)
        const popupContent = `
          <div class="map-popup">
            <div class="map-popup__content">
              ${markerData.popup.length > 50
                ? markerData.popup.substring(0, 50) + '...'
                : markerData.popup}
            </div>
          </div>
        `
        marker.bindPopup(popupContent, {
          maxWidth: 200,
          className: 'map-popup-wrapper'
        })
      }

      markersRef.current.set(markerData.id, marker)
    })
  }, [markers])

  // Полноэкранный режим (задача 24)
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return

    if (!isFullscreen) {
      if (mapContainerRef.current.requestFullscreen) {
        mapContainerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className="map-fixed-container">
      <div ref={mapContainerRef} className="map-fixed" />

      {/* Кнопка полноэкранного режима (задача 24) */}
      <button
        className="map-fullscreen-btn"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Выход из полноэкранного режима" : "Полноэкранный режим"}
      >
        {isFullscreen ? '⤦' : '⤢'}
      </button>
    </div>
  )
}

export default MapFixed