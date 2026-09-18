import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/jwt.js';
import { createUser, findUserByEmail, sanitizeUser } from '../repositories/userRepository.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';

export const register = async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const existing = await findUserByEmail(payload.email);
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const password_hash = await bcrypt.hash(payload.password, env.bcryptRounds);
  const user = await createUser({ ...payload, password_hash });
  const token = signToken(user);
  res.status(201).json({ user, token });
};

export const login = async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const user = await findUserByEmail(payload.email);
  if (!user) throw new AppError('Account not found.', 404);
  if (user.account_status !== 'ACTIVE') throw new AppError('Your account is not active.', 403);

  const valid = await bcrypt.compare(payload.password, user.password_hash);
  if (!valid) throw new AppError('Incorrect email or password.', 401);

  res.json({ user: sanitizeUser(user), token: signToken(user) });
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const logout = async (req, res) => {
  res.json({ message: 'Logged out. Please remove the token on the client.' });
};
