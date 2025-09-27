import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { createOrderValidation } from '../utils/validation';

const router = Router();
const orderController = new OrderController();

// POST /api/orders/create - Create new taxi order (postDrive API)
router.post('/create', optionalAuth, createOrderValidation, orderController.createOrder);

// GET /api/orders/active - Get active orders (protected route)
router.get('/active', authenticateToken, orderController.getActiveOrders);

// POST /api/orders/cancel - Cancel order
router.post('/cancel', optionalAuth, orderController.cancelOrder);

// GET /api/orders/:id - Get order by ID
router.get('/:id', orderController.getOrderById);

export default router;