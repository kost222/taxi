import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import Database from '../models/database';
import { User } from '../types';

interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ message: 'JWT secret not configured' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    const db = Database.getDb();
    const getAsync = promisify(db.get.bind(db));

    const user = await getAsync(
      'SELECT * FROM users WHERE id = ?',
      [decoded.userId]
    ) as User;

    if (!user) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    const db = Database.getDb();
    const getAsync = promisify(db.get.bind(db));

    const user = await getAsync(
      'SELECT * FROM users WHERE id = ?',
      [decoded.userId]
    ) as User;

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Ignore authentication errors in optional auth
    next();
  }
};