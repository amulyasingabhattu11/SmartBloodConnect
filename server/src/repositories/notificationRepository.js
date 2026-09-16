import { query } from '../config/db.js';

export const createNotification = async (payload) => {
  const result = await query(
    `INSERT INTO notifications (user_id, request_id, match_id, type, title, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [payload.user_id, payload.request_id || null, payload.match_id || null, payload.type, payload.title, payload.message]
  );
  return result.rows[0];
};

export const listNotificationsForUser = async (userId) => {
  const result = await query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const markNotificationViewed = async (notificationId, userId) => {
  const result = await query(
    `UPDATE notifications SET status = 'VIEWED'
     WHERE notification_id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0] || null;
};

export const updateNotificationStatus = async (matchId, status) => {
  await query(
    `UPDATE notifications SET status = $2
     WHERE match_id = $1 AND type = 'DONOR_EMERGENCY_REQUEST'`,
    [matchId, status]
  );
};

