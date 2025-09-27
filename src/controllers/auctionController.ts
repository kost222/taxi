import { Request, Response } from 'express'
import { db } from '../models'
import { io } from '../server' // WebSocket для real-time обновлений

// Создать аукцион для заказа
export const createAuction = async (req: Request, res: Response) => {
  const { orderId, initialPrice, duration = 300 } = req.body // duration в секундах

  try {
    // Проверяем, нет ли активного аукциона для этого заказа
    const existing = await db.get(
      'SELECT * FROM order_auctions WHERE order_id = ? AND status = "active"',
      [orderId]
    )

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Для этого заказа уже есть активный аукцион'
      })
    }

    // Создаем аукцион
    const endTime = new Date(Date.now() + duration * 1000)
    const result = await db.run(`
      INSERT INTO order_auctions (
        order_id, initial_price, current_price,
        start_time, end_time, status, bid_count
      ) VALUES (?, ?, ?, datetime('now'), ?, 'active', 0)
    `, [orderId, initialPrice, initialPrice, endTime.toISOString()])

    // Отправляем уведомление всем водителям через WebSocket
    io.emit('auction:new', {
      auctionId: result.lastID,
      orderId,
      initialPrice,
      endTime
    })

    // Запускаем таймер для автоматического завершения аукциона
    setTimeout(() => {
      closeAuction(result.lastID)
    }, duration * 1000)

    res.json({
      success: true,
      auctionId: result.lastID,
      endTime
    })
  } catch (error) {
    console.error('Error creating auction:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании аукциона'
    })
  }
}

// Сделать ставку
export const placeBid = async (req: Request, res: Response) => {
  const { auctionId, driverId, bidAmount } = req.body

  try {
    // Получаем текущий аукцион
    const auction = await db.get(
      'SELECT * FROM order_auctions WHERE id = ? AND status = "active"',
      [auctionId]
    )

    if (!auction) {
      return res.status(404).json({
        success: false,
        error: 'Аукцион не найден или уже завершен'
      })
    }

    // Проверяем, что ставка выше текущей цены
    if (bidAmount <= auction.current_price) {
      return res.status(400).json({
        success: false,
        error: 'Ставка должна быть выше текущей цены'
      })
    }

    // Проверяем, что аукцион не истек
    if (new Date() > new Date(auction.end_time)) {
      await closeAuction(auctionId)
      return res.status(400).json({
        success: false,
        error: 'Время аукциона истекло'
      })
    }

    // Сохраняем ставку
    await db.run(`
      INSERT INTO auction_bids (
        auction_id, driver_id, bid_amount, bid_time
      ) VALUES (?, ?, ?, datetime('now'))
    `, [auctionId, driverId, bidAmount])

    // Обновляем текущую цену аукциона
    await db.run(`
      UPDATE order_auctions
      SET current_price = ?, bid_count = bid_count + 1,
          last_bidder_id = ?
      WHERE id = ?
    `, [bidAmount, driverId, auctionId])

    // Отправляем обновление всем участникам через WebSocket
    io.emit('auction:bid', {
      auctionId,
      driverId,
      bidAmount,
      timestamp: new Date()
    })

    res.json({
      success: true,
      message: 'Ставка принята',
      currentPrice: bidAmount
    })
  } catch (error) {
    console.error('Error placing bid:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка при размещении ставки'
    })
  }
}

// Получить активные аукционы
export const getActiveAuctions = async (req: Request, res: Response) => {
  try {
    const auctions = await db.all(`
      SELECT a.*, o.from_address, o.to_address, o.distance
      FROM order_auctions a
      JOIN orders o ON a.order_id = o.id
      WHERE a.status = 'active'
        AND a.end_time > datetime('now')
      ORDER BY a.current_price DESC
    `)

    res.json({ success: true, auctions })
  } catch (error) {
    console.error('Error fetching auctions:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении аукционов'
    })
  }
}

// Получить историю ставок
export const getBidHistory = async (req: Request, res: Response) => {
  const { auctionId } = req.params

  try {
    const bids = await db.all(`
      SELECT b.*, d.name as driver_name
      FROM auction_bids b
      JOIN drivers d ON b.driver_id = d.id
      WHERE b.auction_id = ?
      ORDER BY b.bid_time DESC
      LIMIT 20
    `, [auctionId])

    res.json({ success: true, bids })
  } catch (error) {
    console.error('Error fetching bid history:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении истории ставок'
    })
  }
}

// Закрыть аукцион
async function closeAuction(auctionId: number) {
  try {
    // Получаем победителя
    const winner = await db.get(`
      SELECT driver_id, MAX(bid_amount) as winning_bid
      FROM auction_bids
      WHERE auction_id = ?
      GROUP BY auction_id
    `, [auctionId])

    if (winner) {
      // Обновляем статус аукциона
      await db.run(`
        UPDATE order_auctions
        SET status = 'closed', winner_id = ?, final_price = ?
        WHERE id = ?
      `, [winner.driver_id, winner.winning_bid, auctionId])

      // Назначаем заказ водителю-победителю
      const auction = await db.get(
        'SELECT order_id FROM order_auctions WHERE id = ?',
        [auctionId]
      )

      if (auction) {
        await db.run(`
          UPDATE orders
          SET driver_id = ?, status = 'assigned', price = ?
          WHERE id = ?
        `, [winner.driver_id, winner.winning_bid, auction.order_id])
      }

      // Уведомляем победителя через WebSocket
      io.emit('auction:closed', {
        auctionId,
        winnerId: winner.driver_id,
        finalPrice: winner.winning_bid
      })
    } else {
      // Если ставок не было, закрываем аукцион без победителя
      await db.run(`
        UPDATE order_auctions
        SET status = 'closed_no_bids'
        WHERE id = ?
      `, [auctionId])

      io.emit('auction:closed', {
        auctionId,
        noBids: true
      })
    }
  } catch (error) {
    console.error('Error closing auction:', error)
  }
}

export { closeAuction }