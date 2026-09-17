import { checkDatabaseConnection, pool } from '../config/db.js';

const describeError = (error) => {
  const nested = error.errors?.map((item) => `${item.code || 'ERROR'} ${item.address || ''}:${item.port || ''}`.trim());
  return nested?.length ? nested.join(', ') : error.message || error.code || String(error);
};

const run = async () => {
  const database = await checkDatabaseConnection();
  console.log('Database connection successful.');
  console.log(`Database: ${database.database_name}`);
  console.log(`User: ${database.database_user}`);
  console.log(`Checked at: ${database.checked_at.toISOString()}`);
  await pool.end();
};

run().catch(async (error) => {
  console.error(`Database connection failed: ${describeError(error)}`);
  await pool.end();
  process.exit(1);
});
