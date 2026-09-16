import { AppError } from '../utils/AppError.js';
import { donorProfileSchema, availabilitySchema } from '../validators/schemas.js';
import {
  findProfileByUserId,
  upsertDonorProfile,
  updateAvailability
} from '../repositories/donorRepository.js';
import { listHistoryForDonorUser } from '../repositories/matchRepository.js';
import { listAllRequests } from '../repositories/requestRepository.js';
import { calculateDistanceKm } from '../services/distanceService.js';
import { isCompatibleForRbcDonation } from '../services/compatibilityService.js';

export const getProfile = async (req, res) => {
  const profile = await findProfileByUserId(req.user.user_id);
  res.json({ profile });
};

export const saveProfile = async (req, res) => {
  const payload = donorProfileSchema.parse(req.body);
  const profile = await upsertDonorProfile(req.user.user_id, payload);
  res.status(200).json({ profile });
};

export const patchAvailability = async (req, res) => {
  const payload = availabilitySchema.parse(req.body);
  const profile = await updateAvailability(req.user.user_id, payload.availability_status);
  if (!profile) throw new AppError('Create a donor profile before changing availability.', 404);
  res.json({ profile });
};

export const getHistory = async (req, res) => {
  const history = await listHistoryForDonorUser(req.user.user_id);
  res.json({ history });
};

export const nearbyRequests = async (req, res) => {
  const profile = await findProfileByUserId(req.user.user_id);
  if (!profile) throw new AppError('Create a donor profile to view nearby requests.', 404);
  const requests = await listAllRequests();
  const nearby = requests
    .filter((request) => ['OPEN', 'MATCHING', 'PARTIALLY_MATCHED'].includes(request.status))
    .filter((request) => isCompatibleForRbcDonation(profile.blood_group, request.required_blood_group))
    .map((request) => ({
      ...request,
      distance_km: calculateDistanceKm(
        { latitude: profile.latitude, longitude: profile.longitude },
        { latitude: request.latitude, longitude: request.longitude }
      )
    }))
    .filter((request) => request.distance_km <= 30)
    .sort((a, b) => a.distance_km - b.distance_km);
  res.json({ requests: nearby });
};

