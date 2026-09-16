import { AppError } from '../utils/AppError.js';
import { findMatchById, updateDonorResponse } from '../repositories/matchRepository.js';
import { incrementDonorResponse } from '../repositories/donorRepository.js';
import { findRequestById, getRequestProgress, updateRequestStatus } from '../repositories/requestRepository.js';
import { notifyRequesterAccepted, setNotificationStatus } from '../services/notificationService.js';

const respondToMatch = async (req, res, response) => {
  const match = await findMatchById(req.params.id);
  if (!match) throw new AppError('Match was not found.', 404);
  if (match.donor_user_id !== req.user.user_id) {
    throw new AppError('You can only respond to requests sent to your donor profile.', 403);
  }
  if (!['MATCHING', 'PARTIALLY_MATCHED', 'OPEN'].includes(match.request_status)) {
    throw new AppError('This emergency request is no longer accepting responses.', 409);
  }
  if (match.donor_response !== 'PENDING') {
    throw new AppError('You have already responded to this request.', 409);
  }

  const updated = await updateDonorResponse(match.match_id, response);
  await incrementDonorResponse(match.donor_id, response);
  await setNotificationStatus(match.match_id, response);

  const request = await findRequestById(match.request_id);
  const progress = await getRequestProgress(match.request_id);

  if (response === 'ACCEPTED') {
    await notifyRequesterAccepted({
      userId: match.requester_id,
      request,
      donorLabel: `Donor #${String(match.donor_id).slice(0, 8)}`
    });
    if (Number(progress.accepted) >= Number(match.units_required)) {
      await updateRequestStatus(match.request_id, 'FULFILLED');
    }
  }

  res.json({ match: updated, progress });
};

export const acceptMatch = (req, res) => respondToMatch(req, res, 'ACCEPTED');
export const declineMatch = (req, res) => respondToMatch(req, res, 'DECLINED');

