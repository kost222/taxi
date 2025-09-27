import { Request, Response } from 'express'
import { db } from '../models'

// Получить все планы подписок
export const getSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    const plans = await db.all(`
      SELECT * FROM subscription_plans
      WHERE active = 1
      ORDER BY price ASC
    `)

    res.json({ success: true, plans })
  } catch (error) {
    console.error('Error fetching plans:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch plans' })
  }
}

// Создать подписку для пользователя
export const createSubscription = async (req: Request, res: Response) => {
  const { userId, planId, paymentId } = req.body

  try {
    // Проверяем существующую подписку
    const existing = await db.get(
      'SELECT * FROM user_subscriptions WHERE user_id = ? AND status = "active"',
      [userId]
    )

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'У вас уже есть активная подписка'
      })
    }

    // Получаем план
    const plan = await db.get(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [planId]
    )

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'План не найден'
      })
    }

    // Создаем подписку
    const result = await db.run(`
      INSERT INTO user_subscriptions (
        user_id, plan_id, payment_id,
        start_date, end_date, status, auto_renew
      ) VALUES (?, ?, ?, datetime('now'),
        datetime('now', '+${plan.duration} days'),
        'active', 1)
    `, [userId, planId, paymentId])

    res.json({
      success: true,
      subscriptionId: result.lastID,
      message: 'Подписка успешно активирована'
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании подписки'
    })
  }
}

// Отменить подписку
export const cancelSubscription = async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    await db.run(
      `UPDATE user_subscriptions
       SET status = 'cancelled', auto_renew = 0
       WHERE user_id = ? AND status = 'active'`,
      [userId]
    )

    res.json({
      success: true,
      message: 'Подписка будет отменена в конце периода'
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка при отмене подписки'
    })
  }
}

// Получить подписку пользователя
export const getUserSubscription = async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    const subscription = await db.get(`
      SELECT s.*, p.name as plan_name, p.features
      FROM user_subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = ? AND s.status = 'active'
    `, [userId])

    res.json({ success: true, subscription })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении подписки'
    })
  }
}