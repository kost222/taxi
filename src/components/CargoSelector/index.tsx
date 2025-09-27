import React, { useState } from 'react'
import { t, TRANSLATION } from '../../localization'
import './styles.scss'

export interface ICargoType {
  id: string
  name: string
  maxWeight: number // kg
  dimensions: {
    length: number // cm
    width: number // cm
    height: number // cm
  }
  icon: string
  priceMultiplier: number
}

export interface ICargoCategory {
  id: string
  name: string
  description: string
  types: ICargoType[]
}

// Predefined cargo categories and types
export const CARGO_CATEGORIES: ICargoCategory[] = [
  {
    id: 'documents',
    name: 'Документы и конверты',
    description: 'Легкие документы и письма',
    types: [
      {
        id: 'envelope',
        name: 'Конверт A4',
        maxWeight: 0.5,
        dimensions: { length: 30, width: 22, height: 2 },
        icon: '📧',
        priceMultiplier: 1.0
      },
      {
        id: 'folder',
        name: 'Папка с документами',
        maxWeight: 2,
        dimensions: { length: 35, width: 25, height: 5 },
        icon: '📁',
        priceMultiplier: 1.1
      }
    ]
  },
  {
    id: 'small_packages',
    name: 'Малые посылки',
    description: 'Небольшие коробки и пакеты',
    types: [
      {
        id: 'small_box',
        name: 'Малая коробка',
        maxWeight: 5,
        dimensions: { length: 30, width: 20, height: 15 },
        icon: '📦',
        priceMultiplier: 1.2
      },
      {
        id: 'medium_box',
        name: 'Средняя коробка',
        maxWeight: 10,
        dimensions: { length: 40, width: 30, height: 25 },
        icon: '📦',
        priceMultiplier: 1.3
      },
      {
        id: 'large_box',
        name: 'Большая коробка',
        maxWeight: 20,
        dimensions: { length: 60, width: 40, height: 40 },
        icon: '📦',
        priceMultiplier: 1.5
      }
    ]
  },
  {
    id: 'fragile',
    name: 'Хрупкие грузы',
    description: 'Требуют особой осторожности',
    types: [
      {
        id: 'electronics',
        name: 'Электроника',
        maxWeight: 15,
        dimensions: { length: 50, width: 40, height: 30 },
        icon: '💻',
        priceMultiplier: 1.8
      },
      {
        id: 'glass',
        name: 'Стекло/Керамика',
        maxWeight: 10,
        dimensions: { length: 40, width: 40, height: 40 },
        icon: '🏺',
        priceMultiplier: 2.0
      },
      {
        id: 'flowers',
        name: 'Цветы',
        maxWeight: 3,
        dimensions: { length: 80, width: 30, height: 30 },
        icon: '💐',
        priceMultiplier: 1.6
      }
    ]
  },
  {
    id: 'heavy',
    name: 'Тяжелые грузы',
    description: 'Грузы свыше 20 кг',
    types: [
      {
        id: 'furniture_small',
        name: 'Малая мебель',
        maxWeight: 50,
        dimensions: { length: 120, width: 60, height: 60 },
        icon: '🪑',
        priceMultiplier: 2.5
      },
      {
        id: 'furniture_large',
        name: 'Крупная мебель',
        maxWeight: 100,
        dimensions: { length: 200, width: 100, height: 80 },
        icon: '🛋️',
        priceMultiplier: 3.0
      },
      {
        id: 'appliances',
        name: 'Бытовая техника',
        maxWeight: 80,
        dimensions: { length: 100, width: 60, height: 60 },
        icon: '🔌',
        priceMultiplier: 2.8
      }
    ]
  },
  {
    id: 'special',
    name: 'Специальные грузы',
    description: 'Требуют особых условий',
    types: [
      {
        id: 'food_cold',
        name: 'Продукты (холод)',
        maxWeight: 30,
        dimensions: { length: 60, width: 40, height: 40 },
        icon: '🧊',
        priceMultiplier: 2.2
      },
      {
        id: 'food_hot',
        name: 'Горячая еда',
        maxWeight: 10,
        dimensions: { length: 40, width: 30, height: 20 },
        icon: '🔥',
        priceMultiplier: 1.8
      },
      {
        id: 'pets',
        name: 'Животные',
        maxWeight: 30,
        dimensions: { length: 60, width: 40, height: 40 },
        icon: '🐕',
        priceMultiplier: 2.5
      },
      {
        id: 'medical',
        name: 'Медицинские товары',
        maxWeight: 10,
        dimensions: { length: 40, width: 30, height: 30 },
        icon: '💊',
        priceMultiplier: 2.0
      }
    ]
  }
]

interface ICargoSelectorProps {
  onCargoSelect: (cargo: ICargoType | null, weight: number, quantity: number) => void
  initialCargo?: ICargoType | null
  initialWeight?: number
  initialQuantity?: number
}

const CargoSelector: React.FC<ICargoSelectorProps> = ({
  onCargoSelect,
  initialCargo = null,
  initialWeight = 0,
  initialQuantity = 1
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ICargoCategory | null>(null)
  const [selectedCargo, setSelectedCargo] = useState<ICargoType | null>(initialCargo)
  const [weight, setWeight] = useState(initialWeight)
  const [quantity, setQuantity] = useState(initialQuantity)
  const [showDimensions, setShowDimensions] = useState(false)
  const [customDimensions, setCustomDimensions] = useState({
    length: 0,
    width: 0,
    height: 0
  })

  const handleCargoSelect = (cargo: ICargoType) => {
    setSelectedCargo(cargo)
    if (weight === 0) {
      setWeight(cargo.maxWeight / 2) // Set default weight to half of max
    }
    onCargoSelect(cargo, weight || cargo.maxWeight / 2, quantity)
  }

  const handleWeightChange = (newWeight: number) => {
    if (selectedCargo && newWeight > selectedCargo.maxWeight) {
      newWeight = selectedCargo.maxWeight
    }
    setWeight(newWeight)
    if (selectedCargo) {
      onCargoSelect(selectedCargo, newWeight, quantity)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    const qty = Math.max(1, Math.min(99, newQuantity))
    setQuantity(qty)
    if (selectedCargo) {
      onCargoSelect(selectedCargo, weight, qty)
    }
  }

  const calculateVolume = (dimensions: { length: number, width: number, height: number }) => {
    const volumeCm3 = dimensions.length * dimensions.width * dimensions.height
    const volumeM3 = volumeCm3 / 1000000
    return volumeM3.toFixed(3)
  }

  const getRecommendedVehicle = () => {
    if (!selectedCargo) return null

    const totalWeight = weight * quantity
    const maxDimension = Math.max(
      selectedCargo.dimensions.length,
      selectedCargo.dimensions.width,
      selectedCargo.dimensions.height
    )

    if (totalWeight <= 10 && maxDimension <= 60) {
      return { type: 'economy', name: 'Эконом', icon: '🚗' }
    } else if (totalWeight <= 50 && maxDimension <= 120) {
      return { type: 'comfort', name: 'Комфорт+', icon: '🚙' }
    } else if (totalWeight <= 100 && maxDimension <= 200) {
      return { type: 'minivan', name: 'Минивэн', icon: '🚐' }
    } else {
      return { type: 'truck', name: 'Грузовой', icon: '🚚' }
    }
  }

  const vehicle = getRecommendedVehicle()

  return (
    <div className="cargo-selector">
      <h3 className="cargo-selector__title">Выберите тип груза</h3>

      <div className="cargo-categories">
        {CARGO_CATEGORIES.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory?.id === category.id ? 'category-btn--active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            <span className="category-name">{category.name}</span>
            <span className="category-desc">{category.description}</span>
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="cargo-types">
          <h4>Типы грузов: {selectedCategory.name}</h4>
          <div className="types-grid">
            {selectedCategory.types.map(cargo => (
              <div
                key={cargo.id}
                className={`cargo-card ${selectedCargo?.id === cargo.id ? 'cargo-card--selected' : ''}`}
                onClick={() => handleCargoSelect(cargo)}
              >
                <div className="cargo-icon">{cargo.icon}</div>
                <div className="cargo-name">{cargo.name}</div>
                <div className="cargo-specs">
                  <span>до {cargo.maxWeight} кг</span>
                  <span>{cargo.dimensions.length}×{cargo.dimensions.width}×{cargo.dimensions.height} см</span>
                </div>
                {cargo.priceMultiplier > 1 && (
                  <div className="cargo-multiplier">
                    +{Math.round((cargo.priceMultiplier - 1) * 100)}% к тарифу
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCargo && (
        <div className="cargo-details">
          <h4>Параметры груза</h4>

          <div className="detail-row">
            <label>Вес груза (кг)</label>
            <div className="weight-input">
              <input
                type="number"
                value={weight}
                onChange={(e) => handleWeightChange(Number(e.target.value))}
                min="0.1"
                max={selectedCargo.maxWeight}
                step="0.1"
              />
              <span className="weight-limit">макс. {selectedCargo.maxWeight} кг</span>
            </div>
          </div>

          <div className="detail-row">
            <label>Количество</label>
            <div className="quantity-input">
              <button onClick={() => handleQuantityChange(quantity - 1)}>−</button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                min="1"
                max="99"
              />
              <button onClick={() => handleQuantityChange(quantity + 1)}>+</button>
            </div>
          </div>

          <div className="detail-row">
            <button
              className="dimensions-toggle"
              onClick={() => setShowDimensions(!showDimensions)}
            >
              {showDimensions ? 'Скрыть размеры' : 'Показать размеры'}
            </button>
          </div>

          {showDimensions && (
            <div className="dimensions-details">
              <div className="standard-dimensions">
                <h5>Стандартные размеры</h5>
                <p>Длина: {selectedCargo.dimensions.length} см</p>
                <p>Ширина: {selectedCargo.dimensions.width} см</p>
                <p>Высота: {selectedCargo.dimensions.height} см</p>
                <p>Объем: {calculateVolume(selectedCargo.dimensions)} м³</p>
              </div>

              <div className="custom-dimensions">
                <h5>Или укажите свои размеры</h5>
                <div className="dimension-inputs">
                  <input
                    type="number"
                    placeholder="Длина (см)"
                    value={customDimensions.length || ''}
                    onChange={(e) => setCustomDimensions({
                      ...customDimensions,
                      length: Number(e.target.value)
                    })}
                  />
                  <input
                    type="number"
                    placeholder="Ширина (см)"
                    value={customDimensions.width || ''}
                    onChange={(e) => setCustomDimensions({
                      ...customDimensions,
                      width: Number(e.target.value)
                    })}
                  />
                  <input
                    type="number"
                    placeholder="Высота (см)"
                    value={customDimensions.height || ''}
                    onChange={(e) => setCustomDimensions({
                      ...customDimensions,
                      height: Number(e.target.value)
                    })}
                  />
                </div>
                {customDimensions.length > 0 && customDimensions.width > 0 && customDimensions.height > 0 && (
                  <p>Объем: {calculateVolume(customDimensions)} м³</p>
                )}
              </div>
            </div>
          )}

          <div className="cargo-summary">
            <h5>Итого</h5>
            <div className="summary-details">
              <p>
                <strong>Груз:</strong> {selectedCargo.icon} {selectedCargo.name}
              </p>
              <p>
                <strong>Общий вес:</strong> {(weight * quantity).toFixed(1)} кг
              </p>
              <p>
                <strong>Количество:</strong> {quantity} шт.
              </p>
              {selectedCargo.priceMultiplier > 1 && (
                <p className="price-adjustment">
                  <strong>Наценка:</strong> +{Math.round((selectedCargo.priceMultiplier - 1) * 100)}%
                </p>
              )}
              {vehicle && (
                <p className="recommended-vehicle">
                  <strong>Рекомендуемый транспорт:</strong> {vehicle.icon} {vehicle.name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CargoSelector