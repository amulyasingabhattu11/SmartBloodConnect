import { matchingConfig } from '../config/matchingConfig.js';
import { AppError } from '../utils/AppError.js';
import { compatibleDonorGroupsForRecipient } from './compatibilityService.js';
import { calculateDistanceKm } from './distanceService.js';
import { isPreliminarilyEligible } from './eligibilityService.js';
import { calculatePriorityScore } from './rankingService.js';
import { listCandidateDonors } from '../repositories/donorRepository.js';
import { findRequestById, getRequestProgress, updateRequestStatus } from '../repositories/requestRepository.js';
import {
  findExistingMatch,
  listPendingMatchesForBatch,
  markMatchNotified,
  nextBatchNumber,
  upsertMatch
} from '../repositories/matchRepository.js';
import { notifyDonorRequest } from './notificationService.js';
import { findNearbyBloodBanks } from '../repositories/bloodBankRepository.js';

const targetCandidateCount = (request) =>
  Math.max(matchingConfig.batchSize, request.units_required * matchingConfig.extraCandidatesPerUnit);

export const runMatchingForRequest = async (requestId) => {
  const request = await findRequestById(requestId);
  if (!request) throw new AppError('Blood request was not found.', 404);
  if (['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(request.status)) {
    throw new AppError(`This emergency request is already ${request.status.toLowerCase()}.`, 409);
  }
  if (new Date(request.required_before).getTime() <= Date.now()) {
    await updateRequestStatus(requestId, 'EXPIRED');
    throw new AppError('This request has expired.', 409);
  }

  const donorGroups = compatibleDonorGroupsForRecipient(request.required_blood_group);
  const donors = await listCandidateDonors();
  const bloodBankOptions = await findNearbyBloodBanks({
    latitude: request.latitude,
    longitude: request.longitude,
    bloodGroup: request.required_blood_group
  });

  let finalRadiusKm = matchingConfig.radiusStepsKm.at(-1);
  let candidates = [];
  const target = targetCandidateCount(request);

  for (const radiusKm of matchingConfig.radiusStepsKm) {
    const scored = [];

    for (const donor of donors) {
      if (!donorGroups.includes(donor.blood_group)) continue;

      const distanceKm = calculateDistanceKm(
        { latitude: request.latitude, longitude: request.longitude },
        { latitude: donor.latitude, longitude: donor.longitude }
      );
      if (distanceKm > radiusKm) continue;

      const existingMatch = await findExistingMatch(request.request_id, donor.donor_id);
      if (!isPreliminarilyEligible(donor, existingMatch)) continue;

      scored.push({
        donor,
        distance_km: distanceKm,
        priority_score: calculatePriorityScore({ donor, distanceKm, radiusKm })
      });
    }

    candidates = scored.sort((a, b) => b.priority_score - a.priority_score || a.distance_km - b.distance_km);
    finalRadiusKm = radiusKm;
    if (candidates.length >= target) break;
  }

  for (const candidate of candidates) {
    await upsertMatch({
      request_id: request.request_id,
      donor_id: candidate.donor.donor_id,
      distance_km: candidate.distance_km,
      priority_score: candidate.priority_score
    });
  }

  const batch = await notifyNextBatch(request.request_id, false);
  const progress = await getRequestProgress(request.request_id);

  return {
    final_radius_km: finalRadiusKm,
    candidate_count: candidates.length,
    notified_count: batch.notified_count,
    progress,
    blood_bank_options: bloodBankOptions,
    message:
      candidates.length === 0
        ? `No suitable potential donors were found within ${finalRadiusKm} km.`
        : 'Potential donor candidates were identified and the first batch was notified.'
  };
};

export const notifyNextBatch = async (requestId, enforceRequestState = true) => {
  const request = await findRequestById(requestId);
  if (!request) throw new AppError('Blood request was not found.', 404);
  if (enforceRequestState && !['OPEN', 'MATCHING', 'PARTIALLY_MATCHED'].includes(request.status)) {
    throw new AppError('This request cannot notify additional donors in its current status.', 409);
  }

  const progress = await getRequestProgress(requestId);
  if (Number(progress.accepted) >= Number(request.units_required)) {
    await updateRequestStatus(requestId, 'FULFILLED');
    return { notified_count: 0, message: 'This emergency request has already been fulfilled.' };
  }

  const pending = await listPendingMatchesForBatch(requestId, matchingConfig.batchSize);
  if (pending.length === 0) {
    return { notified_count: 0, message: 'No additional pending candidates are available.' };
  }

  const batchNumber = await nextBatchNumber(requestId);
  for (const match of pending) {
    await markMatchNotified(match.match_id, batchNumber);
    await notifyDonorRequest({
      userId: match.user_id,
      request,
      matchId: match.match_id,
      distanceKm: match.distance_km
    });
  }

  await updateRequestStatus(requestId, 'PARTIALLY_MATCHED');
  return { notified_count: pending.length, batch_number: batchNumber };
};

