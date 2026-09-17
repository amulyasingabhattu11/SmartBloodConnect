import { query } from '../config/db.js';
import { listUsers, updateUserStatus } from '../repositories/userRepository.js';
import { listAllRequests, updateRequestStatus } from '../repositories/requestRepository.js';
import { requestStatusSchema } from '../validators/schemas.js';
import { AppError } from '../utils/AppError.js';
import { listDonorsForAdmin } from '../repositories/donorRepository.js';

export const stats = async (req, res) => {
  const result = await query(
    `SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM donor_profiles) AS donors,
      (SELECT COUNT(*)::int FROM blood_requests WHERE status IN ('OPEN','MATCHING','PARTIALLY_MATCHED')) AS active_requests,
      (SELECT COUNT(*)::int FROM donor_matches WHERE donor_response = 'ACCEPTED') AS accepted_matches`
  );
  res.json({ stats: result.rows[0] });
};

export const users = async (req, res) => {
  res.json({ users: await listUsers() });
};

export const donors = async (req, res) => {
  res.json({ donors: await listDonorsForAdmin() });
};

export const setUserStatus = async (req, res) => {
  if (!['ACTIVE', 'DISABLED'].includes(req.body.account_status)) {
    throw new AppError('Invalid account status.', 422);
  }
  const user = await updateUserStatus(req.params.id, req.body.account_status);
  if (!user) throw new AppError('User was not found.', 404);
  res.json({ user });
};

export const requests = async (req, res) => {
  res.json({ requests: await listAllRequests() });
};

export const setRequestStatus = async (req, res) => {
  const payload = requestStatusSchema.parse(req.body);
  const request = await updateRequestStatus(req.params.id, payload.status);
  if (!request) throw new AppError('Blood request was not found.', 404);
  res.json({ request });
};
