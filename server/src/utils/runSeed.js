import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedFile = path.resolve(__dirname, '../../seeds/demo.sql');

const run = async () => {
  const sql = await fs.readFile(seedFile, 'utf8');
  await pool.query(sql);
  await pool.end();
  console.log('Demo seed data inserted.');
};

run().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});

