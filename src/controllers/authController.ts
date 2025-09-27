import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import Database from '../models/database';
import { User } from '../types';

export class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        userType
      } = req.body;

      const db = Database.getDb();
      const getAsync = promisify(db.get.bind(db));
      const runAsync = promisify(db.run.bind(db));

      // Check if user already exists
      const existingUser = await getAsync(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser) {
        res.status(400).json({
          message: 'User with this email already exists'
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userId = uuidv4();
      const now = new Date().toISOString();

      await runAsync(`
        INSERT INTO users (id, email, password, firstName, lastName, phone, userType, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, email, hashedPassword, firstName, lastName, phone, userType, now, now]);

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        res.status(500).json({ message: 'JWT secret not configured' });
        return;
      }

      const token = jwt.sign(
        { userId },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        success: true,
        user: {
          id: userId,
          email,
          firstName,
          lastName,
          phone,
          userType
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        message: 'Internal server error',
        success: false
      });
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { email, password } = req.body;

      const db = Database.getDb();
      const getAsync = promisify(db.get.bind(db));

      // Find user
      const user = await getAsync(
        'SELECT * FROM users WHERE email = ?',
        [email]
      ) as User;

      if (!user) {
        res.status(401).json({
          message: 'Invalid credentials',
          success: false
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          message: 'Invalid credentials',
          success: false
        });
        return;
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        res.status(500).json({ message: 'JWT secret not configured' });
        return;
      }

      const token = jwt.sign(
        { userId: user.id },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        success: true,
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        message: 'Internal server error',
        success: false
      });
    }
  }

  public async getProfile(req: Request & { user?: User }, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: 'User not authenticated',
          success: false
        });
        return;
      }

      const { password: _, ...userWithoutPassword } = req.user;

      res.json({
        message: 'Profile retrieved successfully',
        success: true,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        message: 'Internal server error',
        success: false
      });
    }
  }
}