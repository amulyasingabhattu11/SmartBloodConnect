import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getHistory,
  getProfile,
  nearbyRequests,
  patchAvailability,
  saveProfile
} from '../controllers/donorController.js';

export const donorRoutes = Router();

donorRoutes.use(requireAuth);
donorRoutes.get('/profile', asyncHandler(getProfile));
donorRoutes.post('/profile', asyncHandler(saveProfile));
donorRoutes.put('/profile', asyncHandler(saveProfile));
donorRoutes.patch('/availability', asyncHandler(patchAvailability));
donorRoutes.get('/history', asyncHandler(getHistory));
donorRoutes.get('/nearby-requests', asyncHandler(nearbyRequests));

