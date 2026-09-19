import {
  createNotification,
  listNotificationsForUser,
  markNotificationViewed,
  updateNotificationStatus
} from '../repositories/notificationRepository.js';
import { publishDonorAlert } from './alertService.js';

/**
 * Create an in-app notification for a donor and, when SNS alerts are enabled,
 * also publish an out-of-app SNS alert.
 *
 * Design 3.4: publishDonorAlert is fire-and-forget — its success or failure
 * must never affect the return value of this function (R4.4).
 */
export const notifyDonorRequest = ({ userId, request, matchId, distanceKm }) => {
  // Fire the SNS alert without awaiting — any failure is logged inside
  // publishDonorAlert and swallowed; it never rejects into this call stack.
  publishDonorAlert({ request, distanceKm }).catch(() => {
    // Extra safety net: publishDonorAlert already catches internally,
    // but this ensures no unhandled rejection if something unexpected throws.
  });

  return createNotification({
    user_id: userId,
    request_id: request.request_id,
    match_id: matchId,
    type: 'DONOR_EMERGENCY_REQUEST',
    title: 'Urgent blood request',
    message: `${request.required_blood_group} needed at ${request.hospital_name}. Approximate distance: ${Number(distanceKm).toFixed(1)} km. Urgency: ${request.urgency}.`
  });
};

export const notifyRequesterAccepted = ({ userId, request, donorLabel }) =>
  createNotification({
    user_id: userId,
    request_id: request.request_id,
    type: 'REQUESTER_DONOR_ACCEPTED',
    title: 'Potential donor accepted',
    message: `${donorLabel} accepted your ${request.required_blood_group} request for ${request.hospital_name}.`
  });

export const getNotifications = listNotificationsForUser;
export const markViewed = markNotificationViewed;
export const setNotificationStatus = updateNotificationStatus;
