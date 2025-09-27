import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { promisify } from 'util';
import Database from '../models/database';
import * as yookassa from '../services/payment/yookassa';
import { User } from '../types';

interface AuthRequest extends Request {
  user?: User;
}

export class PaymentController {
  // Create payment for order
  public async createPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
          success: false
        });
        return;
      }

      const { orderId, amount, description } = req.body;

      if (!req.user) {
        res.status(401).json({
          message: 'Authentication required',
          success: false
        });
        return;
      }

      const db = Database.getDb();
      const getAsync = promisify(db.get.bind(db));
      const runAsync = promisify(db.run.bind(db));

      // Verify order exists and belongs to user
      const order = await getAsync(
        'SELECT * FROM orders WHERE b_id = ? AND b_passenger_id = ?',
        [orderId, req.user.id]
      );

      if (!order) {
        res.status(404).json({
          message: 'Order not found',
          success: false
        });
        return;
      }

      // Create payment with YooKassa
      const payment = await yookassa.createPayment({
        amount,
        description: description || `Оплата заказа №${orderId}`,
        userId: req.user.id,
        orderId
      });

      // Save payment info to database
      await runAsync(`
        INSERT INTO payments (
          payment_id, order_id, user_id, amount, currency,
          status, confirmation_url, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        payment.paymentId,
        orderId,
        req.user.id,
        payment.amount,
        payment.currency,
        payment.status,
        payment.confirmationUrl,
        payment.createdAt
      ]);

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        payment: {
          paymentId: payment.paymentId,
          confirmationUrl: payment.confirmationUrl,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status
        }
      });
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({
        message: 'Failed to create payment',
        success: false
      });
    }
  }

  // Handle YooKassa webhook
  public async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const result = await yookassa.handleWebhook(req.body);

      if (result.status === 'ignored') {
        res.json({ status: 'ok' });
        return;
      }

      const db = Database.getDb();
      const runAsync = promisify(db.run.bind(db));
      const getAsync = promisify(db.get.bind(db));

      // Update payment status
      await runAsync(`
        UPDATE payments
        SET status = ?, updated_at = ?
        WHERE payment_id = ?
      `, [result.status, new Date().toISOString(), result.paymentId]);

      // If payment succeeded, update order status
      if (result.status === 'succeeded' && result.metadata?.orderId) {
        await runAsync(`
          UPDATE orders
          SET status = 'paid', price = ?, updatedAt = ?
          WHERE b_id = ?
        `, [result.amount, new Date().toISOString(), result.metadata.orderId]);
      }

      res.json({ status: 'ok' });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // Get payment status
  public async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;

      const db = Database.getDb();
      const getAsync = promisify(db.get.bind(db));

      // Try to get from database first
      let payment = await getAsync(
        'SELECT * FROM payments WHERE payment_id = ?',
        [paymentId]
      );

      if (!payment) {
        // If not in database, check with YooKassa
        const status = await yookassa.getPaymentStatus(paymentId);
        res.json({
          success: true,
          payment: status
        });
      } else {
        res.json({
          success: true,
          payment
        });
      }
    } catch (error) {
      console.error('Error getting payment status:', error);
      res.status(500).json({
        message: 'Failed to get payment status',
        success: false
      });
    }
  }

  // Create refund
  public async createRefund(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
          success: false
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          message: 'Authentication required',
          success: false
        });
        return;
      }

      const { paymentId, amount } = req.body;

      const db = Database.getDb();
      const getAsync = promisify(db.get.bind(db));
      const runAsync = promisify(db.run.bind(db));

      // Verify payment exists and belongs to user
      const payment = await getAsync(
        'SELECT * FROM payments WHERE payment_id = ? AND user_id = ?',
        [paymentId, req.user.id]
      );

      if (!payment) {
        res.status(404).json({
          message: 'Payment not found',
          success: false
        });
        return;
      }

      // Create refund with YooKassa
      const refund = await yookassa.createRefund({ paymentId, amount });

      // Save refund info to database
      await runAsync(`
        INSERT INTO refunds (
          refund_id, payment_id, amount, currency,
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        refund.refundId,
        paymentId,
        refund.amount,
        refund.currency,
        refund.status,
        refund.createdAt
      ]);

      res.status(201).json({
        success: true,
        message: 'Refund created successfully',
        refund
      });
    } catch (error) {
      console.error('Create refund error:', error);
      res.status(500).json({
        message: 'Failed to create refund',
        success: false
      });
    }
  }

  // Get user payment methods
  public async getPaymentMethods(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: 'Authentication required',
          success: false
        });
        return;
      }

      const db = Database.getDb();
      const allAsync = promisify(db.all.bind(db));

      const methods = await allAsync(`
        SELECT DISTINCT
          payment_method_id, card_last4, card_type
        FROM payment_methods
        WHERE user_id = ? AND is_active = 1
        ORDER BY created_at DESC
      `, [req.user.id]);

      res.json({
        success: true,
        paymentMethods: methods
      });
    } catch (error) {
      console.error('Error getting payment methods:', error);
      res.status(500).json({
        message: 'Failed to get payment methods',
        success: false
      });
    }
  }
}