import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { bankInventory, nearbyBloodBanks } from '../controllers/bloodBankController.js';

export const bloodBankRoutes = Router();

bloodBankRoutes.use(requireAuth);
bloodBankRoutes.get('/nearby', asyncHandler(nearbyBloodBanks));
bloodBankRoutes.get('/:id/inventory', asyncHandler(bankInventory));

