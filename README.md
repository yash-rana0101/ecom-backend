# Vibe Commerce Backend API

Backend REST API for the shopping cart application.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Copy `.env` file and update MongoDB URI if needed

3. Start the server:
```bash
npm run dev
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products/seed` - Seed mock products

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Checkout
- `POST /api/checkout` - Process checkout
- `GET /api/checkout/orders` - Get order history

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development/production)
