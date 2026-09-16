import { query } from '../config/db.js';

export const findExistingMatch = async (requestId, donorId) => {
  const result = await query(
    'SELECT * FROM donor_matches WHERE request_id = $1 AND donor_id = $2',
    [requestId, donorId]
  );
  return result.rows[0] || null;
};

export const upsertMatch = async ({ request_id, donor_id, distance_km, priority_score }) => {
  const result = await query(
    `INSERT INTO donor_matches (request_id, donor_id, distance_km, priority_score)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (request_id, donor_id)
     DO UPDATE SET
       distance_km = EXCLUDED.distance_km,
       priority_score = EXCLUDED.priority_score,
       updated_at = now()
     RETURNING *`,
    [request_id, donor_id, distance_km, priority_score]
  );
  return result.rows[0];
};

export const listMatchesForRequest = async (requestId) => {
  const result = await query(
    `SELECT dm.*, dp.blood_group, dp.availability_status,
      CONCAT('Donor #', SUBSTRING(dp.donor_id::text, 1, 8)) AS donor_label
     FROM donor_matches dm
     JOIN donor_profiles dp ON dp.donor_id = dm.donor_id
     WHERE dm.request_id = $1
     ORDER BY dm.priority_score DESC, dm.distance_km ASC`,
    [requestId]
  );
  return result.rows;
};

export const listPendingMatchesForBatch = async (requestId, limit) => {
  const result = await query(
    `SELECT dm.*, dp.user_id
     FROM donor_matches dm
     JOIN donor_profiles dp ON dp.donor_id = dm.donor_id
     WHERE dm.request_id = $1
       AND dm.notification_status = 'PENDING'
       AND dm.donor_response = 'PENDING'
     ORDER BY dm.priority_score DESC, dm.distance_km ASC
     LIMIT $2`,
    [requestId, limit]
  );
  return result.rows;
};

export const nextBatchNumber = async (requestId) => {
  const result = await query(
    'SELECT COALESCE(MAX(batch_number), 0) + 1 AS next_batch FROM donor_matches WHERE request_id = $1',
    [requestId]
  );
  return Number(result.rows[0].next_batch);
};

export const markMatchNotified = async (matchId, batchNumber) => {
  const result = await query(
    `UPDATE donor_matches
     SET notification_status = 'SENT', batch_number = $2, updated_at = now()
     WHERE match_id = $1
     RETURNING *`,
    [matchId, batchNumber]
  );
  return result.rows[0];
};

export const findMatchById = async (matchId) => {
  const result = await query(
    `SELECT dm.*, br.requester_id, br.units_required, br.status AS request_status, br.required_blood_group,
      br.hospital_name, br.request_id, dp.user_id AS donor_user_id
     FROM donor_matches dm
     JOIN blood_requests br ON br.request_id = dm.request_id
     JOIN donor_profiles dp ON dp.donor_id = dm.donor_id
     WHERE dm.match_id = $1`,
    [matchId]
  );
  return result.rows[0] || null;
};

export const updateDonorResponse = async (matchId, response) => {
  const result = await query(
    `UPDATE donor_matches
     SET donor_response = $2,
         notification_status = $2,
         updated_at = now()
     WHERE match_id = $1
     RETURNING *`,
    [matchId, response]
  );
  return result.rows[0];
};

export const listHistoryForDonorUser = async (userId) => {
  const result = await query(
    `SELECT dm.*, br.required_blood_group, br.hospital_name, br.urgency, br.required_before
     FROM donor_matches dm
     JOIN donor_profiles dp ON dp.donor_id = dm.donor_id
     JOIN blood_requests br ON br.request_id = dm.request_id
     WHERE dp.user_id = $1
     ORDER BY dm.updated_at DESC`,
    [userId]
  );
  return result.rows;
};

