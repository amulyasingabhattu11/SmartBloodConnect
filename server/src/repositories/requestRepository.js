import { query } from '../config/db.js';

export const createBloodRequest = async (requesterId, payload) => {
  const result = await query(
    `INSERT INTO blood_requests
      (requester_id, patient_reference, required_blood_group, hospital_name, hospital_address,
       latitude, longitude, location_accuracy_m, location_captured_at, units_required, urgency, required_before, note, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'MATCHING')
     RETURNING *`,
    [
      requesterId,
      payload.patient_reference,
      payload.required_blood_group,
      payload.hospital_name,
      payload.hospital_address,
      payload.latitude,
      payload.longitude,
      payload.location_accuracy_m,
      payload.location_captured_at,
      payload.units_required,
      payload.urgency,
      payload.required_before,
      payload.note || null
    ]
  );
  return result.rows[0];
};

export const findRequestById = async (requestId) => {
  const result = await query(
    `SELECT br.*, u.name AS requester_name
     FROM blood_requests br
     JOIN users u ON u.user_id = br.requester_id
     WHERE br.request_id = $1`,
    [requestId]
  );
  return result.rows[0] || null;
};

export const listRequestsForUser = async (userId) => {
  const result = await query(
    `SELECT br.*,
      COUNT(dm.match_id)::int AS candidate_count,
      COUNT(dm.match_id) FILTER (WHERE dm.notification_status IN ('SENT', 'VIEWED', 'ACCEPTED', 'DECLINED'))::int AS notified_count,
      COUNT(dm.match_id) FILTER (WHERE dm.donor_response = 'ACCEPTED')::int AS accepted_count,
      COUNT(dm.match_id) FILTER (WHERE dm.donor_response = 'DECLINED')::int AS declined_count
     FROM blood_requests br
     LEFT JOIN donor_matches dm ON dm.request_id = br.request_id
     WHERE br.requester_id = $1
     GROUP BY br.request_id
     ORDER BY br.created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const listAllRequests = async () => {
  const result = await query(
    `SELECT br.*, u.name AS requester_name,
      COUNT(dm.match_id)::int AS candidate_count,
      COUNT(dm.match_id) FILTER (WHERE dm.donor_response = 'ACCEPTED')::int AS accepted_count
     FROM blood_requests br
     JOIN users u ON u.user_id = br.requester_id
     LEFT JOIN donor_matches dm ON dm.request_id = br.request_id
     GROUP BY br.request_id, u.name
     ORDER BY br.created_at DESC`
  );
  return result.rows;
};

export const updateRequestStatus = async (requestId, status) => {
  const result = await query(
    `UPDATE blood_requests SET status = $2, updated_at = now()
     WHERE request_id = $1
     RETURNING *`,
    [requestId, status]
  );
  return result.rows[0] || null;
};

export const getRequestProgress = async (requestId) => {
  const result = await query(
    `SELECT
      COUNT(*)::int AS candidates_identified,
      COUNT(*) FILTER (WHERE notification_status IN ('SENT', 'VIEWED', 'ACCEPTED', 'DECLINED'))::int AS notified,
      COUNT(*) FILTER (WHERE donor_response = 'ACCEPTED')::int AS accepted,
      COUNT(*) FILTER (WHERE donor_response = 'DECLINED')::int AS declined,
      COUNT(*) FILTER (WHERE notification_status IN ('SENT', 'VIEWED'))::int AS pending
     FROM donor_matches
     WHERE request_id = $1`,
    [requestId]
  );
  return result.rows[0];
};

export const getDashboardStats = async (userId) => {
  const result = await query(
    `SELECT
      COUNT(*) FILTER (WHERE status IN ('OPEN', 'MATCHING', 'PARTIALLY_MATCHED'))::int AS active_requests,
      COUNT(*) FILTER (WHERE status = 'FULFILLED')::int AS completed_requests
     FROM blood_requests
     WHERE requester_id = $1`,
    [userId]
  );
  return result.rows[0];
};
