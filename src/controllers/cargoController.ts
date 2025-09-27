import { Request, Response } from 'express'
import { db } from '../models'

// Получить типы грузов
export const getCargoTypes = async (req: Request, res: Response) => {
  try {
    const cargoTypes = await db.all(`
      SELECT * FROM cargo_types
      WHERE active = 1
      ORDER BY category, max_weight ASC
    `)

    res.json({ success: true, cargoTypes })
  } catch (error) {
    console.error('Error fetching cargo types:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch cargo types' })
  }
}

// Рассчитать стоимость с учетом груза
export const calculateCargoPrice = async (req: Request, res: Response) => {
  const { cargoId, weight, quantity, distance, basePrice } = req.body

  try {
    // Получаем тип груза
    const cargo = await db.get(
      'SELECT * FROM cargo_types WHERE id = ?',
      [cargoId]
    )

    if (!cargo) {
      return res.status(404).json({
        success: false,
        error: 'Тип груза не найден'
      })
    }

    // Проверяем ограничения по весу
    const totalWeight = weight * quantity
    if (totalWeight > cargo.max_weight) {
      return res.status(400).json({
        success: false,
        error: `Превышен максимальный вес для типа груза (макс: ${cargo.max_weight} кг)`
      })
    }

    // Рассчитываем цену с учетом множителя
    const priceMultiplier = cargo.price_multiplier || 1.0
    const finalPrice = basePrice * priceMultiplier

    // Добавляем доплату за вес (если больше стандартного)
    const standardWeight = cargo.max_weight * 0.3 // 30% от максимального
    let weightSurcharge = 0
    if (totalWeight > standardWeight) {
      const excessWeight = totalWeight - standardWeight
      weightSurcharge = excessWeight * 5 // 5 руб за кг сверх нормы
    }

    // Добавляем доплату за количество
    let quantitySurcharge = 0
    if (quantity > 1) {
      quantitySurcharge = (quantity - 1) * 50 // 50 руб за каждую дополнительную единицу
    }

    const totalPrice = finalPrice + weightSurcharge + quantitySurcharge

    res.json({
      success: true,
      pricing: {
        basePrice,
        priceMultiplier,
        finalPrice,
        weightSurcharge,
        quantitySurcharge,
        totalPrice,
        cargoType: cargo.name,
        recommendedVehicle: getRecommendedVehicle(totalWeight, cargo)
      }
    })
  } catch (error) {
    console.error('Error calculating cargo price:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка при расчете стоимости'
    })
  }
}

// Сохранить информацию о грузе в заказе
export const saveCargoInfo = async (req: Request, res: Response) => {
  const { orderId, cargoId, weight, quantity, dimensions } = req.body

  try {
    await db.run(`
      INSERT INTO order_cargo (
        order_id, cargo_type_id, weight,
        quantity, length, width, height
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId, cargoId, weight, quantity,
      dimensions?.length || 0,
      dimensions?.width || 0,
      dimensions?.height || 0
    ])

    res.json({
      success: true,
      message: 'Информация о грузе сохранена'
    })
  } catch (error) {
    console.error('Error saving cargo info:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка при сохранении информации о грузе'
    })
  }
}

// Вспомогательная функция для определения рекомендуемого транспорта
function getRecommendedVehicle(totalWeight: number, cargo: any) {
  const maxDimension = Math.max(
    cargo.max_length || 0,
    cargo.max_width || 0,
    cargo.max_height || 0
  )

  if (totalWeight <= 10 && maxDimension <= 60) {
    return { type: 'economy', name: 'Эконом', capacity: 'до 10 кг' }
  } else if (totalWeight <= 50 && maxDimension <= 120) {
    return { type: 'comfort_plus', name: 'Комфорт+', capacity: 'до 50 кг' }
  } else if (totalWeight <= 100 && maxDimension <= 200) {
    return { type: 'minivan', name: 'Минивэн', capacity: 'до 100 кг' }
  } else {
    return { type: 'truck', name: 'Грузовой', capacity: 'от 100 кг' }
  }
}