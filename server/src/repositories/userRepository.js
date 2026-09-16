import { query } from '../config/db.js';

const publicUserFields = `
  user_id, name, email, phone, role, account_status, created_at, updated_at
`;

export const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

export const createUser = async ({ name, email, phone, password_hash }) => {
  const result = await query(
    `INSERT INTO users (name, email, phone, password_hash)
     VALUES ($1, LOWER($2), $3, $4)
     RETURNING ${publicUserFields}`,
    [name, email, phone, password_hash]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE email = LOWER($1)', [email]);
  return result.rows[0] || null;
};

export const findUserById = async (userId) => {
  const result = await query(`SELECT ${publicUserFields} FROM users WHERE user_id = $1`, [userId]);
  return result.rows[0] || null;
};

export const listUsers = async () => {
  const result = await query(`SELECT ${publicUserFields} FROM users ORDER BY created_at DESC`);
  return result.rows;
};

export const updateUserStatus = async (userId, accountStatus) => {
  const result = await query(
    `UPDATE users SET account_status = $2, updated_at = now()
     WHERE user_id = $1
     RETURNING ${publicUserFields}`,
    [userId, accountStatus]
  );
  return result.rows[0] || null;
};

