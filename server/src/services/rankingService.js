import { matchingConfig } from '../config/matchingConfig.js';
import { donationRecencyScore } from './eligibilityService.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const calculatePriorityScore = ({ donor, distanceKm, radiusKm }) => {
  const distanceScore = clamp(100 - (distanceKm / radiusKm) * 100, 0, 100);
  const recencyScore = donationRecencyScore(donor.last_donation_date);
  const responseCount = Number(donor.response_count || 0);
  const reliabilityScore =
    responseCount === 0 ? 70 : clamp((Number(donor.accept_count || 0) / responseCount) * 100, 0, 100);
  const urgencyFitScore = donor.availability_status === 'AVAILABLE' ? 100 : 0;

  const weighted =
    distanceScore * matchingConfig.weights.distance +
    recencyScore * matchingConfig.weights.recency +
    reliabilityScore * matchingConfig.weights.reliability +
    urgencyFitScore * matchingConfig.weights.urgencyFit;

  return clamp(Math.round(weighted), 0, 100);
};

