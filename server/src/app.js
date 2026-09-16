import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

export const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, '../../client/dist');

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ruby-api', demoMode: env.demoMode });
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
