import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listNotifications, readNotification } from '../controllers/notificationController.js';

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);
notificationRoutes.get('/', asyncHandler(listNotifications));
notificationRoutes.patch('/:id/read', asyncHandler(readNotification));

