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

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  demoMode: String(process.env.DEMO_MODE ?? 'false').toLowerCase() === 'true',
  port: numberFromEnv('PORT', 5000),
  clientOrigin: required('CLIENT_ORIGIN', 'http://localhost:5173'),
  databaseUrl: required('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/ruby_blood'),
  jwtSecret: required('JWT_SECRET', 'development-only-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  bcryptRounds: numberFromEnv('BCRYPT_ROUNDS', 12)
};
