import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { promisify } from 'util';
import Database from '../models/database';
import { User, Driver } from '../types';

interface AuthRequest extends Request {
  user?: User;
}

export class DriverController {
  public async getNearbyDrivers(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, radius = 10, carClass } = req.query;

      if (!latitude || !longitude) {
        res.status(400).json({
          message: 'Latitude and longitude are required',
          success: false
        });
        return;
      }

      const db = Database.getDb();
      const allAsync = promisify(db.all.bind(db));

      let query = `
        SELECT
          driverCode, firstName, lastName, carModel, carNumber, carColor,
          carClass, latitude, longitude, rating, totalRides
        FROM drivers
        WHERE isActive = 1
      `;

      const params: any[] = [];

      if (carClass) {
        query += ' AND carClass = ?';
        params.push(carClass);
      }

      query += ' ORDER BY rating DESC, totalRides DESC LIMIT 20';

      const drivers = await allAsync(query, params);

      // Calculate distance and filter by radius
      const lat1 = parseFloat(latitude as string);
      const lon1 = parseFloat(longitude as string);
      const maxRadius = parseFloat(radius as string);

      const nearbyDrivers = drivers
        .map((driver: any) => {
          const distance = DriverController.calculateDistance(
            lat1,
            lon1,
            driver.latitude,
            driver.longitude
          );
          return { ...driver, distance };
        })
        .filter((driver: any) => driver.distance <= maxRadius)
        .sort((a: any, b: any) => a.distance - b.distance);

      res.json({
        message: 'Nearby drivers retrieved successfully',
        success: true,
        drivers: nearbyDrivers
      });
    } catch (error) {
      console.error('Get nearby drivers error:', error);
      res.status(500).json({
        message: 'Internal server error',
        success: false
      });
    }
  }

  public async updateDriverPosition(req: AuthRequest, res: Response): Promise<void> {
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

      const { latitude, longitude } = req.body;

      const db = Database.getDb();
      const runAsync = promisify(db.run.bind(db));
      const getAsync = promisify(db.get.bind(db));

      // Check if user is a driver
      const driver = await getAsync(
        'SELECT * FROM drivers WHERE id = ?',
        [req.user.id]
      );

      if (!driver) {
        res.status(403).json({
          message: 'Only drivers can update their position',
          success: false
        });
        return;
      }

      // Update driver position
      await runAsync(`
        UPDATE drivers
        SET latitude = ?, longitude = ?, updatedAt = ?
        WHERE id = ?
      `, [latitude, longitude, new Date().toISOString(), req.user.id]);

      res.json({
        message: 'Driver position updated successfully',
        success: true
      });
    } catch (error) {
      console.error('Update driver position error:', error);
      res.status(500).json({
        message: 'Internal server error',
        success: false
      });
    }
  }

  public async getDriverInfo(req: Request, res: Response): Promise<void> {
    try {
      const { driverCode } = req.params;

      const db = Database.getDb();
      const getAsync = promisify(db.get.bind(db));

      const driver = await getAsync(`
        SELECT
          driverCode, firstName, lastName, carModel, carNumber, carColor,
          carClass, latitude, longitude, rating, totalRides, isActive
        FROM drivers
        WHERE driverCode = ?
      `, [driverCode]);

      if (!driver) {
        res.status(404).json({
          message: 'Driver not found',
          success: false
        });
        return;
      }

      res.json({
        message: 'Driver information retrieved successfully',
        success: true,
        driver
      });
    } catch (error) {
      console.error('Get driver info error:', error);
      res.status(500).json({
        message: 'Internal server error',
        success: false
      });
    }
  }

  public async toggleDriverStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: 'Authentication required',
          success: false
        });
        return;
      }

      const { isActive } = req.body;

      const db = Database.getDb();
      const runAsync = promisify(db.run.bind(db));
      const getAsync = promisify(db.get.bind(db));

      // Check if user is a driver
      const driver = await getAsync(
        'SELECT * FROM drivers WHERE id = ?',
        [req.user.id]
      );

      if (!driver) {
        res.status(403).json({
          message: 'Only drivers can toggle their status',
          success: false
        });
        return;
      }

      // Update driver status
      await runAsync(`
        UPDATE drivers
        SET isActive = ?, updatedAt = ?
        WHERE id = ?
      `, [isActive ? 1 : 0, new Date().toISOString(), req.user.id]);

      res.json({
        message: `Driver status updated to ${isActive ? 'active' : 'inactive'}`,
        success: true
      });
    } catch (error) {
      console.error('Toggle driver status error:', error);
      res.status(500).json({
        message: 'Internal server error',
        success: false
      });
    }
  }

  public async getAllDrivers(req: Request, res: Response): Promise<void> {
    try {
      const { carClass, isActive } = req.query;

      const db = Database.getDb();
      const allAsync = promisify(db.all.bind(db));

      let query = `
        SELECT
          driverCode, firstName, lastName, carModel, carNumber, carColor,
          carClass, latitude, longitude, rating, totalRides, isActive
        FROM drivers
        WHERE 1=1
      `;

      const params: any[] = [];

      if (carClass) {
        query += ' AND carClass = ?';
        params.push(carClass);
      }

      if (isActive !== undefined) {
        query += ' AND isActive = ?';
        params.push(isActive === 'true' ? 1 : 0);
      }

      query += ' ORDER BY rating DESC, totalRides DESC';

      const drivers = await allAsync(query, params);

      res.json({
        message: 'Drivers retrieved successfully',
        success: true,
        drivers
      });
    } catch (error) {
      console.error('Get all drivers error:', error);
      res.status(500).json({
        message: 'Internal server error',
        success: false
      });
    }
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = DriverController.deg2rad(lat2 - lat1);
    const dLon = DriverController.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(DriverController.deg2rad(lat1)) * Math.cos(DriverController.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}