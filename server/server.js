import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import servicesRoutes from './routes/services.js';
import clientsRoutes from './routes/clients.js';
import clientServicesRoutes from './routes/clientServices.js';
import billingRoutes from './routes/billing.js';
import paymentRoutes from './routes/payments.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import cron jobs
import { startCronJobs } from './utils/cronJobs.js';

dotenv.config();

const app = express();

const envCorsOrigin = (process.env.CORS_ORIGIN || '').trim();
const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://ca-client-tracker.vercel.app',
];
const allowedOrigins =
  envCorsOrigin && !defaultCorsOrigins.includes(envCorsOrigin)
    ? [...defaultCorsOrigins, envCorsOrigin]
    : defaultCorsOrigins;

// Security Middleware (CORP same-origin can block credentialed cross-origin fetches)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});

app.use(limiter);

// Body parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-tracker';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB connected');
    // Start cron jobs after DB connection
    startCronJobs();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Health check (no rate limit)
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    message: 'CA Practice Management & Billing Tracker API',
    version: '3.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      services: '/api/services',
      clients: '/api/clients',
      clientServices: '/api/client-services',
      billing: '/api/billing',
      payments: '/api/payments'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/client-services', clientServicesRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentRoutes);

// 404 Handler
app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   CA Practice Management & Billing Tracker v3              ║
║   ✓ Server running on http://localhost:${PORT}
║   ✓ MongoDB: ${MONGODB_URI.includes('localhost') ? 'Local' : 'Cloud'}                            ║
║   ✓ Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per 15min
║   ✓ CORS: ${allowedOrigins.join(', ')}  ║
║   ✓ Cron Jobs: Enabled (Billing + Overdue)                 ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
