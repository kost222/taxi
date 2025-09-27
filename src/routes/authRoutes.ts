import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { registerValidation, loginValidation } from '../utils/validation';

const router = Router();
const authController = new AuthController();

// POST /api/auth/register - User registration
router.post('/register', registerValidation, authController.register);

// POST /api/auth/login - User login
router.post('/login', loginValidation, authController.login);

// GET /api/auth/profile - Get user profile (protected route)
router.get('/profile', authenticateToken, authController.getProfile);

export default router;