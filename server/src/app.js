import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { donorRoutes } from './routes/donorRoutes.js';
import { requestRoutes } from './routes/requestRoutes.js';
import { matchRoutes } from './routes/matchRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';
import { bloodBankRoutes } from './routes/bloodBankRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { demoRoutes } from './routes/demoRoutes.js';
import { checkDatabaseConnection } from './config/db.js';

export const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const allowedOrigins = new Set([env.clientOrigin]);

if (env.demoMode || env.nodeEnv !== 'production') {
  allowedOrigins.add(`http://localhost:${env.port}`);
  allowedOrigins.add(`http://127.0.0.1:${env.port}`);
}

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: env.nodeEnv === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('CORS origin is not allowed.'));
    },
    credentials: true
  })
);
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests. Please try again later.' }
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  if (env.demoMode) {
    return res.json({ status: 'ok', service: 'ruby-api', mode: 'demo', database: 'not-used' });
  }
  try {
    const database = await checkDatabaseConnection();
    return res.json({ status: 'ok', service: 'ruby-api', mode: 'database', database: 'connected', database_name: database.database_name });
  } catch {
    return res.status(503).json({ status: 'error', service: 'ruby-api', mode: 'database', database: 'unavailable' });
  }
});

if (env.demoMode) {
  app.use('/api', demoRoutes);
} else {
  app.use('/api/auth', authRoutes);
  app.use('/api/donors', donorRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/blood-banks', bloodBankRoutes);
  app.use('/api/admin', adminRoutes);
}

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);
