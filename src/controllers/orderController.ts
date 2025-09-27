import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import Database from '../models/database';
import { User, Order, CreateOrderRequest, CreateOrderResponse } from '../types';

interface AuthRequest extends Request {
  user?: User;
}

export class OrderController {
  public async createOrder(req: AuthRequest, res: Response): Promise<void> {
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

      const orderData: CreateOrderRequest = req.body;
      const db = Database.getDb();
      const runAsync = promisify(db.run.bind(db));
      const getAsync = promisify(db.get.bind(db));

      // Use authenticated user if available, otherwise create anonymous order
      const passengerId = req.user?.id || 'anonymous';

      const orderId = uuidv4();
      const now = new Date().toISOString();

      // Find nearby available driver
      const nearbyDriver = await getAsync(`
        SELECT driverCode, latitude, longitude
        FROM drivers
        WHERE isActive = 1 AND carClass = ?
        ORDER BY RANDOM()
        LIMIT 1
      `, [orderData.b_car_class]);

      const driverCode = nearbyDriver ? nearbyDriver.driverCode : null;

      // Create order
      await runAsync(`
        INSERT INTO orders (
          b_id, b_driver_code, b_passenger_id, b_start_address, b_start_latitude,
          b_start_longitude, b_destination_address, b_destination_latitude,
          b_destination_longitude, b_contact, b_start_datetime, b_passengers_count,
          b_car_class, b_payment_way, b_max_waiting, b_services, b_options,
          status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        driverCode,
        passengerId,
        orderData.b_start_address,
        orderData.b_start_latitude,
        orderData.b_start_longitude,
        orderData.b_destination_address,
        orderData.b_destination_latitude,
        orderData.b_destination_longitude,
        orderData.b_contact,
        orderData.b_start_datetime,
        orderData.b_passengers_count,
        orderData.b_car_class,
        orderData.b_payment_way,
        orderData.b_max_waiting,
        JSON.stringify(orderData.b_services),
        JSON.stringify(orderData.b_options),
        driverCode ? 'accepted' : 'pending',
        now,
        now
      ]);

      const response: CreateOrderResponse = {
        b_id: orderId,
        b_driver_code: driverCode,
        message: driverCode
          ? 'Order created and assigned to driver successfully'
          : 'Order created successfully, searching for driver',
        success: true
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        b_id: '',
        b_driver_code: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  public async getActiveOrders(req: AuthRequest, res: Response): Promise<void> {
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

      const orders = await allAsync(`
        SELECT * FROM orders
        WHERE b_passenger_id = ? AND status IN ('pending', 'accepted', 'in_progress')
        ORDER BY createdAt DESC
      `, [req.user.id]);

      // Parse JSON fields
      const parsedOrders = orders.map((order: any) => ({
        ...order,
        b_services: JSON.parse(order.b_services),
        b_options: JSON.parse(order.b_options)
      }));

      res.json({
        message: 'Active orders retrieved successfully',
        success: true,
        orders: parsedOrders
      });
    } catch (error) {
      console.error('Get active orders error:', error);
      res.status(500).json({
        message: 'Internal server error',
        success: false
      });
    }
  }

  public async cancelOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        res.status(400).json({
          message: 'Order ID is required',
          success: false
        });
        return;
      }

      const db = Database.getDb();
      const getAsync = promisify(db.get.bind(db));
      const runAsync = promisify(db.run.bind(db));

      // Check if order exists and belongs to user
      const order = await getAsync(`
        SELECT * FROM orders
        WHERE b_id = ? ${req.user ? 'AND b_passenger_id = ?' : ''}
      `, req.user ? [orderId, req.user.id] : [orderId]);

      if (!order) {
        res.status(404).json({
          message: 'Order not found',
          success: false
        });
        return;
      }

      if (order.status === 'cancelled') {
        res.status(400).json({
          message: 'Order is already cancelled',
          success: false
        });
        return;
      }

      if (order.status === 'completed') {
        res.status(400).json({
          message: 'Cannot cancel completed order',
          success: false
        });
        return;
      }

      // Cancel the order
      await runAsync(`
        UPDATE orders
        SET status = 'cancelled', updatedAt = ?
        WHERE b_id = ?
      `, [new Date().toISOString(), orderId]);

      res.json({
        message: 'Order cancelled successfully',
        success: true
      });
    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({
        message: 'Internal server error',
        success: false
      });
    }
  }

  public async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const db = Database.getDb();
      const getAsync = promisify(db.get.bind(db));

      const order = await getAsync('SELECT * FROM orders WHERE b_id = ?', [id]);

      if (!order) {
        res.status(404).json({
          message: 'Order not found',
          success: false
        });
        return;
      }

      // Parse JSON fields
      const parsedOrder = {
        ...order,
        b_services: JSON.parse(order.b_services),
        b_options: JSON.parse(order.b_options)
      };

      res.json({
        message: 'Order retrieved successfully',
        success: true,
        order: parsedOrder
      });
    } catch (error) {
      console.error('Get order by ID error:', error);
      res.status(500).json({
        message: 'Internal server error',
        success: false
      });
    }
  }
}