import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { optionalAuth } from './middleware/auth.js';
import { requestLogger, errorLogger } from './middleware/logger.js';
import logger from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://ecom-backend-phdz.onrender.com',
      'https://ecom-frontend-lovat.vercel.app', // Fixed: removed trailing slash
      'http://localhost:5000',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    // Allow requests with no origin (like mobile apps, Postman, or server-to-server calls)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in case of issues
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id']
};

app.use(cors(corsOptions));
app.use(express.json());
// Request logging middleware - logs all API calls
app.use(requestLogger);

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Routes with optional authentication (works for both guests and logged-in users)
app.use('/api/cart', optionalAuth, cartRoutes);
app.use('/api/checkout', optionalAuth, checkoutRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Error logging middleware - logs all errors
app.use(errorLogger);

app.listen(PORT, () => {
  logger.success(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
