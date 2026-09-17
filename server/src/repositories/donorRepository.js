import { query } from '../config/db.js';

export const findProfileByUserId = async (userId) => {
  const result = await query('SELECT * FROM donor_profiles WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
};

export const upsertDonorProfile = async (userId, profile) => {
  const result = await query(
    `INSERT INTO donor_profiles
      (user_id, blood_group, latitude, longitude, location_label, location_accuracy_m,
       location_captured_at, last_donation_date, availability_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id)
     DO UPDATE SET
      blood_group = EXCLUDED.blood_group,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      location_label = EXCLUDED.location_label,
      location_accuracy_m = EXCLUDED.location_accuracy_m,
      location_captured_at = EXCLUDED.location_captured_at,
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
      profile.location_accuracy_m ?? null,
      profile.location_captured_at || new Date().toISOString(),
      profile.last_donation_date || null,
      profile.availability_status
    ]
  );
  return result.rows[0];
};

export const listDonorsForAdmin = async () => {
  const result = await query(
    `SELECT dp.donor_id, dp.user_id, u.name, u.email, u.phone, u.account_status,
            dp.blood_group, dp.availability_status, dp.latitude, dp.longitude,
            dp.location_label, dp.location_accuracy_m, dp.location_captured_at,
            dp.last_donation_date, dp.updated_at
     FROM donor_profiles dp
     JOIN users u ON u.user_id = dp.user_id
     ORDER BY dp.location_captured_at DESC NULLS LAST, dp.updated_at DESC`
  );
  return result.rows;
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
