import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  changeRequestStatus,
  createRequest,
  dashboard,
  getMatches,
  getRequest,
  listMyRequests,
  matchRequest,
  notifyNext
} from '../controllers/requestController.js';

export const requestRoutes = Router();

requestRoutes.use(requireAuth);
requestRoutes.get('/dashboard', asyncHandler(dashboard));
requestRoutes.post('/', asyncHandler(createRequest));
requestRoutes.get('/', asyncHandler(listMyRequests));
requestRoutes.get('/:id', asyncHandler(getRequest));
requestRoutes.patch('/:id/status', asyncHandler(changeRequestStatus));
requestRoutes.post('/:id/match', asyncHandler(matchRequest));
requestRoutes.get('/:id/matches', asyncHandler(getMatches));
requestRoutes.post('/:id/notify-next-batch', asyncHandler(notifyNext));

