import dotenv from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') });

import dns from 'node:dns';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

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

const app = express();

// Needed so req.secure / HTTPS + cookie SameSite=None logic match real clients behind Render/Fly/Railway/nginx.
const isHostedRuntime =
  process.env.NODE_ENV === 'production' ||
  process.env.RENDER === 'true' ||
  Boolean(process.env.RAILWAY_ENVIRONMENT) ||
  Boolean(process.env.FLY_APP_NAME);
if (isHostedRuntime || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', Number(process.env.TRUST_PROXY_COUNT) || 1);
}

const envCorsOrigin = (process.env.CORS_ORIGIN || '').trim();

/** Any https host ending in .vercel.app (production + preview / branch deploys). */
const vercelAppOrigin = /^https:\/\/[^\s/]+\.vercel\.app$/;

/** Production frontend + local dev; env CORS_ORIGIN adds another allowed origin if set. */
const corsStaticOrigins = [
  'https://ca-client-tracker.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  ...(envCorsOrigin ? [envCorsOrigin] : []),
];

// CORS must run before Helmet so preflight and credentialed responses always get ACAO / ACAC headers.
app.use(
  cors({
    origin: [...corsStaticOrigins, vercelAppOrigin],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    // Omit allowedHeaders — cors reflects Access-Control-Request-Headers from the browser (Axios-safe).
    optionsSuccessStatus: 204,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Rate Limiting (do not count CORS preflight — blocked OPTIONS often surface as "CORS" in the browser)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  skip: (req) => req.method === 'OPTIONS',
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

// MongoDB — connect before accepting HTTP traffic so queries never hit the 10s "buffering timed out" state.
const MONGODB_URI = process.env.MONGODB_URI?.trim() || 'mongodb://127.0.0.1:27017/ca-tracker';

const mongooseOpts = {
  serverSelectionTimeoutMS: 15_000,
};

// Health check (no rate limit) — always 200 so Render sees a listening process; `db` reflects Mongo readiness.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    db: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
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

async function connectMongo() {
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
  await mongoose.connect(MONGODB_URI, mongooseOpts);
  console.log('✓ MongoDB connected');
  startCronJobs();
}

function logStartupBanner() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   CA Practice Management & Billing Tracker v3              ║
║   ✓ Server running on http://localhost:${PORT}
║   ✓ MongoDB: ${MONGODB_URI.includes('localhost') ? 'Local' : 'Cloud'}                            ║
║   ✓ Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per 15min
║   ✓ CORS: https://ca-client-tracker.vercel.app + *.vercel.app + localhost + CORS_ORIGIN ║
║   ✓ Cron Jobs: Enabled (Billing + Overdue)                 ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

function start() {
  // Bind HTTP before MongoDB so OPTIONS/CORS and Render health checks succeed while Atlas connects.
  app.listen(PORT, () => {
    console.log(`✓ HTTP listening on port ${PORT} (MongoDB connecting…)`);
    connectMongo()
      .then(() => {
        logStartupBanner();
      })
      .catch((err) => {
        const msg = String(err?.message ?? err ?? '');
        console.error('MongoDB connection failed:', msg);
        if (/querySrv|_mongodb\._tcp/i.test(msg)) {
          console.error(
            '\nThis error is DNS for mongodb+srv:// (Atlas SRV record lookup), not your password.\n' +
              'Often: VPN, strict firewall/antivirus DNS, ISP/corporate DNS, or flaky network.\n' +
              'Try:\n' +
              '  1. Atlas → Connect → Drivers → use the non-SRV "standard connection" string (explicit hostnames :27017)\n' +
              '     and set that as MONGODB_URI.\n' +
              '  2. Pause VPN; try mobile hotspot.\n' +
              '  3. Windows: try another DNS (e.g. 1.1.1.1 or 8.8.8.8) on your active adapter.\n'
          );
        } else if (
          !/querySrv/i.test(msg) &&
          /ECONNREFUSED.*(127\.0\.0\.1|localhost).*27017/i.test(msg.replace(/\s+/g, ' '))
        ) {
          console.error('\nStill targeting local MongoDB — confirm server/.env has MONGODB_URI saved.');
        }
        console.error(
          'Atlas (after DNS works): allow your IP / 0.0.0.0/0 in Network Access; cluster not paused; user/password matches URI.'
        );
        process.exit(1);
      });
  });
}

start();
