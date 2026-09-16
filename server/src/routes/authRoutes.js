import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { login, logout, me, register } from '../controllers/authController.js';

export const authRoutes = Router();

authRoutes.post('/register', authRateLimiter, asyncHandler(register));
authRoutes.post('/login', authRateLimiter, asyncHandler(login));
authRoutes.get('/me', requireAuth, asyncHandler(me));
authRoutes.post('/logout', requireAuth, asyncHandler(logout));

