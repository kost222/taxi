import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { User, Driver, Order } from '../types';

class Database {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor() {
    this.dbPath = process.env.DB_PATH || './database.sqlite';
    this.db = new sqlite3.Database(this.dbPath);
    this.init();
  }

  private async init() {
    await this.createTables();
    await this.insertMockData();
  }

  private async createTables() {
    const runAsync = promisify(this.db.run.bind(this.db));

    // Users table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        phone TEXT NOT NULL,
        userType TEXT NOT NULL CHECK (userType IN ('passenger', 'driver')),
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Drivers table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        phone TEXT NOT NULL,
        userType TEXT NOT NULL DEFAULT 'driver',
        driverCode TEXT UNIQUE NOT NULL,
        carModel TEXT NOT NULL,
        carNumber TEXT NOT NULL,
        carColor TEXT NOT NULL,
        carClass TEXT NOT NULL CHECK (carClass IN ('economy', 'comfort', 'business', 'premium')),
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        isActive BOOLEAN NOT NULL DEFAULT 1,
        rating REAL NOT NULL DEFAULT 5.0,
        totalRides INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Orders table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS orders (
        b_id TEXT PRIMARY KEY,
        b_driver_code TEXT,
        b_passenger_id TEXT NOT NULL,
        b_start_address TEXT NOT NULL,
        b_start_latitude REAL NOT NULL,
        b_start_longitude REAL NOT NULL,
        b_destination_address TEXT NOT NULL,
        b_destination_latitude REAL NOT NULL,
        b_destination_longitude REAL NOT NULL,
        b_contact TEXT NOT NULL,
        b_start_datetime TEXT NOT NULL,
        b_passengers_count INTEGER NOT NULL,
        b_car_class TEXT NOT NULL CHECK (b_car_class IN ('economy', 'comfort', 'business', 'premium')),
        b_payment_way TEXT NOT NULL CHECK (b_payment_way IN ('cash', 'card', 'online')),
        b_max_waiting INTEGER NOT NULL,
        b_services TEXT NOT NULL,
        b_options TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'paid')),
        price REAL,
        payment_id TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (b_passenger_id) REFERENCES users(id),
        FOREIGN KEY (b_driver_code) REFERENCES drivers(driverCode)
      )
    `);

    // Payments table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        confirmation_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(b_id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Refunds table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS refunds (
        refund_id TEXT PRIMARY KEY,
        payment_id TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
      )
    `);

    // Payment methods table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        payment_method_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        card_last4 TEXT,
        card_type TEXT,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('Database tables created successfully');
  }

  private async insertMockData() {
    const runAsync = promisify(this.db.run.bind(this.db));
    const getAsync = promisify(this.db.get.bind(this.db));

    // Check if mock data already exists
    const existingDriver = await getAsync('SELECT COUNT(*) as count FROM drivers');
    if (existingDriver && existingDriver.count > 0) {
      console.log('Mock data already exists, skipping insertion');
      return;
    }

    const hashedPassword = await bcrypt.hash('123456', 10);
    const now = new Date().toISOString();

    // Insert mock drivers
    const mockDrivers = [
      {
        id: uuidv4(),
        email: 'driver1@taxi.com',
        firstName: 'Алексей',
        lastName: 'Петров',
        phone: '+7999123456',
        driverCode: 'DRV001',
        carModel: 'Hyundai Solaris',
        carNumber: 'А123БВ77',
        carColor: 'Белый',
        carClass: 'economy',
        latitude: 55.7558,
        longitude: 37.6176,
        rating: 4.8
      },
      {
        id: uuidv4(),
        email: 'driver2@taxi.com',
        firstName: 'Дмитрий',
        lastName: 'Иванов',
        phone: '+7999234567',
        driverCode: 'DRV002',
        carModel: 'Skoda Rapid',
        carNumber: 'В456ГД77',
        carColor: 'Серый',
        carClass: 'comfort',
        latitude: 55.7388,
        longitude: 37.6302,
        rating: 4.9
      },
      {
        id: uuidv4(),
        email: 'driver3@taxi.com',
        firstName: 'Сергей',
        lastName: 'Сидоров',
        phone: '+7999345678',
        driverCode: 'DRV003',
        carModel: 'Toyota Camry',
        carNumber: 'Г789ЕЖ77',
        carColor: 'Черный',
        carClass: 'business',
        latitude: 55.7558,
        longitude: 37.6176,
        rating: 4.7
      },
      {
        id: uuidv4(),
        email: 'driver4@taxi.com',
        firstName: 'Михаил',
        lastName: 'Козлов',
        phone: '+7999456789',
        driverCode: 'DRV004',
        carModel: 'Mercedes E-Class',
        carNumber: 'Д012ЗИ77',
        carColor: 'Черный',
        carClass: 'premium',
        latitude: 55.7500,
        longitude: 37.6200,
        rating: 4.9
      },
      {
        id: uuidv4(),
        email: 'driver5@taxi.com',
        firstName: 'Андрей',
        lastName: 'Новиков',
        phone: '+7999567890',
        driverCode: 'DRV005',
        carModel: 'Kia Rio',
        carNumber: 'Е345КЛ77',
        carColor: 'Синий',
        carClass: 'economy',
        latitude: 55.7400,
        longitude: 37.6100,
        rating: 4.6
      }
    ];

    for (const driver of mockDrivers) {
      await runAsync(`
        INSERT INTO drivers (
          id, email, password, firstName, lastName, phone, userType,
          driverCode, carModel, carNumber, carColor, carClass,
          latitude, longitude, isActive, rating, totalRides, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, 'driver', ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, ?, ?)
      `, [
        driver.id, driver.email, hashedPassword, driver.firstName, driver.lastName,
        driver.phone, driver.driverCode, driver.carModel, driver.carNumber,
        driver.carColor, driver.carClass, driver.latitude, driver.longitude,
        driver.rating, now, now
      ]);
    }

    // Insert a test passenger
    const passengerId = uuidv4();
    await runAsync(`
      INSERT INTO users (id, email, password, firstName, lastName, phone, userType, createdAt, updatedAt)
      VALUES (?, 'passenger@test.com', ?, 'Иван', 'Тестовый', '+7999000000', 'passenger', ?, ?)
    `, [passengerId, hashedPassword, now, now]);

    console.log('Mock data inserted successfully');
  }

  public getDb(): sqlite3.Database {
    return this.db;
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export default new Database();