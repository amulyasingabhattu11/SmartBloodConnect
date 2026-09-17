import dotenv from 'dotenv';

dotenv.config();

const required = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const numberFromEnv = (key, fallback) => Number(process.env[key] ?? fallback);
const demoMode = String(process.env.DEMO_MODE ?? 'false').toLowerCase() === 'true';
const nodeEnv = process.env.NODE_ENV ?? 'development';
const jwtSecret = process.env.JWT_SECRET;
const databaseUrl = process.env.DATABASE_URL;

if (!demoMode && (!jwtSecret || jwtSecret.length < 32 || jwtSecret === 'development-only-change-me')) {
  throw new Error('JWT_SECRET must be set to a strong secret of at least 32 characters when DEMO_MODE is false.');
}

if (!demoMode && !databaseUrl) {
  throw new Error('DATABASE_URL must be set when DEMO_MODE is false.');
}

export const env = {
  nodeEnv,
  demoMode,
  port: numberFromEnv('PORT', 5000),
  clientOrigin: required('CLIENT_ORIGIN', 'http://localhost:5173'),
  databaseUrl: databaseUrl || 'postgres://postgres:postgres@localhost:5432/ruby_blood',
  databaseSsl: String(process.env.DATABASE_SSL ?? 'false').toLowerCase() === 'true',
  databasePoolMax: numberFromEnv('DATABASE_POOL_MAX', 10),
  databaseConnectionTimeoutMs: numberFromEnv('DATABASE_CONNECTION_TIMEOUT_MS', 5000),
  jwtSecret: demoMode ? required('JWT_SECRET', 'local-demo-secret-change-me') : jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  bcryptRounds: numberFromEnv('BCRYPT_ROUNDS', 12)
};
