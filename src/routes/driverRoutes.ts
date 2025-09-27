import { Router } from 'express';
import { DriverController } from '../controllers/driverController';
import { authenticateToken } from '../middleware/auth';
import { updateDriverPositionValidation } from '../utils/validation';

const router = Router();
const driverController = new DriverController();

// GET /api/drivers/nearby - Get nearby drivers
router.get('/nearby', driverController.getNearbyDrivers);

// POST /api/drivers/position - Update driver position (protected route)
router.post('/position', authenticateToken, updateDriverPositionValidation, driverController.updateDriverPosition);

// GET /api/drivers/:driverCode - Get driver info by driver code
router.get('/:driverCode', driverController.getDriverInfo);

// POST /api/drivers/toggle-status - Toggle driver active status (protected route)
router.post('/toggle-status', authenticateToken, driverController.toggleDriverStatus);

// GET /api/drivers - Get all drivers with optional filters
router.get('/', driverController.getAllDrivers);

export default router;