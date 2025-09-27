# Taxi Backend API

A complete RESTful API server for taxi applications built with Node.js, Express, TypeScript, and SQLite.

## Features

- 🚕 Complete taxi booking system
- 🔐 JWT authentication
- 🗄️ SQLite database with mock data
- 🔌 Real-time updates with WebSocket
- 🛡️ Security with helmet and rate limiting
- 📱 CORS enabled for frontend integration
- 🎯 TypeScript for type safety

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Orders
- `POST /api/orders/create` - Create new taxi order (postDrive API)
- `GET /api/orders/active` - Get active orders (protected)
- `POST /api/orders/cancel` - Cancel order
- `GET /api/orders/:id` - Get order by ID

### Drivers
- `GET /api/drivers/nearby` - Get nearby drivers
- `POST /api/drivers/position` - Update driver position (protected)
- `GET /api/drivers/:driverCode` - Get driver info by code
- `POST /api/drivers/toggle-status` - Toggle driver status (protected)
- `GET /api/drivers` - Get all drivers with filters

### WebSocket Events
- `authenticate` - Authenticate WebSocket connection
- `driver_position_update` - Update driver position
- `order_status_update` - Update order status
- `join_order_room` - Join order room for updates

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. The server will be available at:
- API: http://localhost:8080
- Health check: http://localhost:8080/health
- API docs: http://localhost:8080/api

## Mock Data

The database is automatically populated with:
- 5 demo drivers with different car classes and positions
- 1 test passenger account
- All passwords are set to "123456" for testing

## Configuration

Edit `.env` file to configure:
- PORT=8080
- JWT_SECRET=your-secret-key
- CORS_ORIGIN=http://localhost:5000
- Database and rate limiting settings

## Database Schema

### Users Table
- Basic user information for passengers
- Authentication credentials

### Drivers Table
- Extended user information for drivers
- Car details, location, rating
- Driver status and metrics

### Orders Table
- Complete order information
- Status tracking and relationships
- Service and option preferences