import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import Database from '../models/database';
import { User } from '../types';

interface AuthenticatedSocket extends Socket {
  user?: User;
  driverCode?: string;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private connectedDrivers: Map<string, string> = new Map(); // driverCode -> socketId
  private connectedPassengers: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5000",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: any) => {
      console.log(`Client connected: ${socket.id}`);

      // Authentication middleware for WebSocket
      socket.on('authenticate', async (data: { token: string }) => {
        try {
          const jwtSecret = process.env.JWT_SECRET;
          if (!jwtSecret) {
            socket.emit('auth_error', { message: 'JWT secret not configured' });
            return;
          }

          const decoded = jwt.verify(data.token, jwtSecret) as { userId: string };

          const db = Database.getDb();
          const getAsync = promisify(db.get.bind(db));

          const user = await getAsync(
            'SELECT * FROM users WHERE id = ?',
            [decoded.userId]
          ) as User;

          if (!user) {
            socket.emit('auth_error', { message: 'Invalid token' });
            return;
          }

          socket.user = user;

          // Check if user is also a driver
          const driver = await getAsync(
            'SELECT driverCode FROM drivers WHERE id = ?',
            [user.id]
          );

          if (driver) {
            socket.driverCode = driver.driverCode;
            this.connectedDrivers.set(driver.driverCode, socket.id);
            socket.join('drivers');
          }

          this.connectedPassengers.set(user.id, socket.id);
          socket.join('passengers');

          socket.emit('authenticated', {
            message: 'Authentication successful',
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              userType: user.userType
            },
            driverCode: driver?.driverCode
          });

          console.log(`User authenticated: ${user.email} (${socket.id})`);
        } catch (error) {
          console.error('WebSocket authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Driver position updates
      socket.on('driver_position_update', async (data: { latitude: number; longitude: number }) => {
        if (!socket.user || !socket.driverCode) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        try {
          const db = Database.getDb();
          const runAsync = promisify(db.run.bind(db));

          await runAsync(`
            UPDATE drivers
            SET latitude = ?, longitude = ?, updatedAt = ?
            WHERE driverCode = ?
          `, [data.latitude, data.longitude, new Date().toISOString(), socket.driverCode]);

          // Broadcast position update to passengers looking for nearby drivers
          socket.to('passengers').emit('driver_position_updated', {
            driverCode: socket.driverCode,
            latitude: data.latitude,
            longitude: data.longitude
          });

          socket.emit('position_update_success', { message: 'Position updated successfully' });
        } catch (error) {
          console.error('Position update error:', error);
          socket.emit('error', { message: 'Failed to update position' });
        }
      });

      // Order status updates
      socket.on('order_status_update', async (data: { orderId: string; status: string }) => {
        if (!socket.user || !socket.driverCode) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        try {
          const db = Database.getDb();
          const runAsync = promisify(db.run.bind(db));
          const getAsync = promisify(db.get.bind(db));

          // Verify the order belongs to this driver
          const order = await getAsync(
            'SELECT * FROM orders WHERE b_id = ? AND b_driver_code = ?',
            [data.orderId, socket.driverCode]
          );

          if (!order) {
            socket.emit('error', { message: 'Order not found or not assigned to you' });
            return;
          }

          // Update order status
          await runAsync(`
            UPDATE orders
            SET status = ?, updatedAt = ?
            WHERE b_id = ?
          `, [data.status, new Date().toISOString(), data.orderId]);

          // Notify the passenger
          const passengerSocketId = this.connectedPassengers.get(order.b_passenger_id);
          if (passengerSocketId) {
            this.io.to(passengerSocketId).emit('order_status_changed', {
              orderId: data.orderId,
              status: data.status,
              driverCode: socket.driverCode
            });
          }

          socket.emit('status_update_success', { message: 'Order status updated successfully' });
        } catch (error) {
          console.error('Order status update error:', error);
          socket.emit('error', { message: 'Failed to update order status' });
        }
      });

      // Join order room for real-time updates
      socket.on('join_order_room', (data: { orderId: string }) => {
        socket.join(`order_${data.orderId}`);
        socket.emit('joined_order_room', { orderId: data.orderId });
      });

      // Leave order room
      socket.on('leave_order_room', (data: { orderId: string }) => {
        socket.leave(`order_${data.orderId}`);
        socket.emit('left_order_room', { orderId: data.orderId });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);

        if (socket.user) {
          this.connectedPassengers.delete(socket.user.id);
        }

        if (socket.driverCode) {
          this.connectedDrivers.delete(socket.driverCode);
        }
      });
    });
  }

  // Public methods to emit events from controllers
  public notifyOrderCreated(orderId: string, orderData: any): void {
    this.io.to('drivers').emit('new_order_available', {
      orderId,
      ...orderData
    });
  }

  public notifyOrderAssigned(orderId: string, passengerId: string, driverCode: string): void {
    const passengerSocketId = this.connectedPassengers.get(passengerId);
    if (passengerSocketId) {
      this.io.to(passengerSocketId).emit('order_assigned', {
        orderId,
        driverCode
      });
    }

    this.io.to(`order_${orderId}`).emit('order_status_changed', {
      orderId,
      status: 'assigned',
      driverCode
    });
  }

  public notifyOrderCancelled(orderId: string): void {
    this.io.to(`order_${orderId}`).emit('order_status_changed', {
      orderId,
      status: 'cancelled'
    });
  }

  public getConnectedDriversCount(): number {
    return this.connectedDrivers.size;
  }

  public getConnectedPassengersCount(): number {
    return this.connectedPassengers.size;
  }
}