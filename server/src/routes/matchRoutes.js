import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { acceptMatch, completeDonation, contactDonor, declineMatch } from '../controllers/matchController.js';

export const matchRoutes = Router();

matchRoutes.use(requireAuth);
matchRoutes.post('/:id/accept', asyncHandler(acceptMatch));
matchRoutes.post('/:id/decline', asyncHandler(declineMatch));
matchRoutes.post('/:id/complete-donation', asyncHandler(completeDonation));
matchRoutes.get('/:id/contact', asyncHandler(contactDonor));
