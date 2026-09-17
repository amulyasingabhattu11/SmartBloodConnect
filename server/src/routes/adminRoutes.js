import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { donors, requests, setRequestStatus, setUserStatus, stats, users } from '../controllers/adminController.js';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get('/stats', asyncHandler(stats));
adminRoutes.get('/users', asyncHandler(users));
adminRoutes.get('/donors', asyncHandler(donors));
adminRoutes.patch('/users/:id/status', asyncHandler(setUserStatus));
adminRoutes.get('/requests', asyncHandler(requests));
adminRoutes.patch('/requests/:id/status', asyncHandler(setRequestStatus));
