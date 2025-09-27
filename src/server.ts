import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import driverRoutes from './routes/driverRoutes';
import paymentRoutes from './routes/paymentRoutes';

// Import utilities
import Database from './models/database';
import { WebSocketManager } from './utils/websocket';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

// Initialize WebSocket manager
const wsManager = new WebSocketManager(server);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    message: 'Too many requests from this IP, please try again later.',
    success: false
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Taxi Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    connectedDrivers: wsManager.getConnectedDriversCount(),
    connectedPassengers: wsManager.getConnectedPassengersCount()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/payments', paymentRoutes);

// Legacy postDrive endpoint for backward compatibility
app.post('/postDrive', async (req, res) => {
  try {
    // Forward the request to the order creation endpoint
    const { OrderController } = await import('./controllers/orderController');
    const orderController = new OrderController();
    await orderController.createOrder(req as any, res);
  } catch (error) {
    console.error('Legacy postDrive error:', error);
    res.status(500).json({
      b_id: '',
      b_driver_code: null,
      message: 'Internal server error',
      success: false
    });
  }
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Taxi Backend API',
    version: '1.0.0',
    description: 'RESTful API server for taxi application',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'User registration',
        'POST /api/auth/login': 'User login',
        'GET /api/auth/profile': 'Get user profile (protected)'
      },
      orders: {
        'POST /api/orders/create': 'Create new taxi order (postDrive API)',
        'GET /api/orders/active': 'Get active orders (protected)',
        'POST /api/orders/cancel': 'Cancel order',
        'GET /api/orders/:id': 'Get order by ID'
      },
      drivers: {
        'GET /api/drivers/nearby': 'Get nearby drivers',
        'POST /api/drivers/position': 'Update driver position (protected)',
        'GET /api/drivers/:driverCode': 'Get driver info by code',
        'POST /api/drivers/toggle-status': 'Toggle driver status (protected)',
        'GET /api/drivers': 'Get all drivers with filters'
      },
      websocket: {
        events: [
          'authenticate - Authenticate WebSocket connection',
          'driver_position_update - Update driver position',
          'order_status_update - Update order status',
          'join_order_room - Join order room for updates',
          'leave_order_room - Leave order room'
        ]
      }
    },
    database: 'SQLite',
    authentication: 'JWT',
    realtime: 'Socket.IO'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    success: false,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Endpoint not found',
    success: false,
    availableEndpoints: [
      'GET /health',
      'GET /api',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/orders/create',
      'GET /api/drivers/nearby'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');

  server.close(async () => {
    try {
      await Database.close();
      console.log('Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');

  server.close(async () => {
    try {
      await Database.close();
      console.log('Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚕 Taxi Backend API Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🛡️ CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5000'}`);
  console.log(`💾 Database: SQLite (${process.env.DB_PATH || './database.sqlite'})`);
});

export default app;