import pg from 'pg';
import { env } from './env.js';

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: env.databasePoolMax,
  connectionTimeoutMillis: env.databaseConnectionTimeoutMs,
  idleTimeoutMillis: 30000,
  ssl: env.databaseSsl ? { rejectUnauthorized: true } : false
});

export const query = (text, params) => pool.query(text, params);

export const checkDatabaseConnection = async () => {
  const result = await pool.query(
    `SELECT current_database() AS database_name,
            current_user AS database_user,
            version() AS database_version,
            now() AS checked_at`
  );
  return result.rows[0];
};
