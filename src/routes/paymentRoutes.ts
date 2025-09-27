import { Router } from 'express';
import { body } from 'express-validator';
import { PaymentController } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const paymentController = new PaymentController();

// Create payment for order
router.post(
  '/create',
  authenticateToken,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('description').optional().isString()
  ],
  paymentController.createPayment
);

// YooKassa webhook (no auth required)
router.post('/webhook', paymentController.handleWebhook);

// Get payment status
router.get('/status/:paymentId', paymentController.getPaymentStatus);

// Create refund
router.post(
  '/refund',
  authenticateToken,
  [
    body('paymentId').notEmpty().withMessage('Payment ID is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0')
  ],
  paymentController.createRefund
);

// Get user payment methods
router.get('/methods', authenticateToken, paymentController.getPaymentMethods);

export default router;