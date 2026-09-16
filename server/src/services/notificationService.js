import {
  createNotification,
  listNotificationsForUser,
  markNotificationViewed,
  updateNotificationStatus
} from '../repositories/notificationRepository.js';

export const notifyDonorRequest = ({ userId, request, matchId, distanceKm }) =>
  createNotification({
    user_id: userId,
    request_id: request.request_id,
    match_id: matchId,
    type: 'DONOR_EMERGENCY_REQUEST',
    title: 'Urgent blood request',
    message: `${request.required_blood_group} needed at ${request.hospital_name}. Approximate distance: ${Number(distanceKm).toFixed(1)} km. Urgency: ${request.urgency}.`
  });

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

