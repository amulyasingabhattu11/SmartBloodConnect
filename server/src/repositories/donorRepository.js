import { query } from '../config/db.js';

export const findProfileByUserId = async (userId) => {
  const result = await query('SELECT * FROM donor_profiles WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
};

export const upsertDonorProfile = async (userId, profile) => {
  const result = await query(
    `INSERT INTO donor_profiles
      (user_id, blood_group, latitude, longitude, location_label, last_donation_date, availability_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id)
     DO UPDATE SET
      blood_group = EXCLUDED.blood_group,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      location_label = EXCLUDED.location_label,
      last_donation_date = EXCLUDED.last_donation_date,
      availability_status = EXCLUDED.availability_status,
      updated_at = now()
     RETURNING *`,
    [
      userId,
      profile.blood_group,
      profile.latitude,
      profile.longitude,
      profile.location_label,
      profile.last_donation_date || null,
      profile.availability_status
    ]
  );
  return result.rows[0];
};

export const updateAvailability = async (userId, availabilityStatus) => {
  const result = await query(
    `UPDATE donor_profiles
     SET availability_status = $2, updated_at = now()
     WHERE user_id = $1
     RETURNING *`,
    [userId, availabilityStatus]
  );
  return result.rows[0] || null;
};

export const listCandidateDonors = async () => {
  const result = await query(
    `SELECT dp.*, u.name, u.account_status
     FROM donor_profiles dp
     JOIN users u ON u.user_id = dp.user_id
     WHERE u.account_status = 'ACTIVE'`
  );
  return result.rows;
};

export const incrementDonorResponse = async (donorId, response) => {
  const acceptIncrement = response === 'ACCEPTED' ? 1 : 0;
  const declineIncrement = response === 'DECLINED' ? 1 : 0;
  await query(
    `UPDATE donor_profiles
     SET response_count = response_count + 1,
         accept_count = accept_count + $2,
         decline_count = decline_count + $3,
         updated_at = now()
     WHERE donor_id = $1`,
    [donorId, acceptIncrement, declineIncrement]
  );
};

