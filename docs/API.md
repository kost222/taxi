# API Documentation

## Backend API (Port 7070)

### Orders

#### POST /orders
Create a new order (supports both Order and Vote modes)

**Request:**
```json
{
  "mode": "order" | "vote",
  "from": { "lat": 55.7558, "lng": 37.6173 },
  "to": { "lat": 55.7558, "lng": 37.6173 }, // optional for vote mode
  "phone": "+7999999999", // optional
  "amountHint": 100000 // in kopecks, optional
}
```

**Response:**
```json
{
  "id": "uuid-string"
}
```

**Error codes:**
- `ERR_MODE` - Invalid mode
- `ERR_FROM` - From location required
- `ERR_TO` - To location required for order mode

### Rides

#### GET /rides/classes
Get trip type and available car classes based on coordinates

**Query params:**
- `from` - lat,lng format (required)
- `to` - lat,lng format (optional)

**Response:**
```json
{
  "type": "city" | "suburb" | "intercity",
  "classes": ["econom", "comfort", "minivan"]
}
```

#### POST /rides/review
Submit a review after ride completion

**Request:**
```json
{
  "rideId": "ride-id",
  "rating": 5,
  "comment": "Great ride!"
}
```

### Vehicles

#### GET /vehicles/nearby
Get nearby vehicles and assigned car

**Query params:**
- `lat` - latitude (required)
- `lng` - longitude (required)
- `rideId` - ride ID to get assigned car (optional)

**Response:**
```json
{
  "nearby": [
    {
      "id": "vehicle-1",
      "lat": 55.7558,
      "lng": 37.6173,
      "status": "idle",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "assignedCar": null | { /* vehicle object */ }
}
```

### Prices

#### POST /prices/client
Set client's desired price (±30% from base)

**Request:**
```json
{
  "rideId": "ride-id",
  "baseAmount": 100000, // kopecks
  "clientAmount": 130000 // kopecks
}
```

**Response:**
```json
{
  "ok": true,
  "min": 70000,
  "max": 130000
}
```

#### GET /prices/auction/:rideId
Get current auction state

**Response:**
```json
{
  "current_price": 150000,
  "last_bid_by": "driver-123",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### POST /prices/auction/bid
Place a bid in auction

**Request:**
```json
{
  "rideId": "ride-id",
  "newPrice": 160000,
  "userId": "driver-123"
}
```

### Status

#### GET /status/health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 3600
}
```

## YooKassa Gateway API (Port 8088)

### POST /api/payments/create
Create a new payment

**Request:**
```json
{
  "amount": 1000,
  "currency": "RUB",
  "description": "Taxi ride payment",
  "userId": "user-123",
  "isSubscription": false,
  "savePaymentMethod": false
}
```

**Response:**
```json
{
  "paymentId": "payment-id",
  "status": "pending",
  "confirmationUrl": "https://yookassa.ru/pay/...",
  "amount": "1000.00",
  "currency": "RUB",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### POST /api/payments/webhook
YooKassa webhook endpoint (configured in YooKassa dashboard)

### GET /api/payments/status/:paymentId
Get payment status

**Response:**
```json
{
  "paymentId": "payment-id",
  "status": "succeeded" | "pending" | "canceled",
  "amount": "1000.00",
  "currency": "RUB",
  "paid": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### POST /api/refunds/create
Create a refund

**Request:**
```json
{
  "paymentId": "payment-id",
  "amount": 500
}
```

### POST /api/payments/charge-saved
Charge a saved payment method

**Request:**
```json
{
  "userId": "user-123",
  "amount": 1000,
  "currency": "RUB",
  "description": "Repeat payment"
}
```

## Error Handling

All APIs return errors in the following format:

```json
{
  "code": "ERR_CODE",
  "message": "Error description",
  "field": "fieldName" // optional, for validation errors
}
```

Common HTTP status codes:
- 200 - Success
- 400 - Bad Request (validation error)
- 404 - Not Found
- 500 - Internal Server Error

## WhatsApp Integration (Task 16)

### Authentication Flow
- `/auth` page with WhatsApp option
- Two-step verification (phone + code)
- Demo code: `1234`
- Integration with WhatsApp Business API required

### Implementation Status
- ✅ Frontend components created
- ✅ UI/UX design completed
- 🚧 WhatsApp Business API integration pending

## Auction System (Task 23 - Phase 1)

### Current Implementation
- Real-time bidding interface
- Driver competition for rides
- Price updates every 5 seconds
- Minimum bid increment validation

### Features
- Live price updates
- Bid history tracking
- Driver identification
- Automatic refresh
- Phase 1: Basic bidding functionality enabled