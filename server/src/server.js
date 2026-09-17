import { app } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseConnection, pool } from './config/db.js';

let server;

const start = async () => {
  if (!env.demoMode) {
    const database = await checkDatabaseConnection();
    console.log(`PostgreSQL connected: ${database.database_name} as ${database.database_user}`);
  }

  server = app.listen(env.port, () => {
    console.log(`Ruby API listening on http://localhost:${env.port}${env.demoMode ? ' (demo mode)' : ''}`);
  });
};

const shutdown = async () => {
  if (!server) {
    await pool.end();
    process.exit(0);
  }
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start().catch(async (error) => {
  console.error('Ruby could not start because PostgreSQL is unavailable.');
  console.error(error.message);
  await pool.end();
  process.exit(1);
});
