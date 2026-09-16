import { query } from '../config/db.js';
import { listUsers, updateUserStatus } from '../repositories/userRepository.js';
import { listAllRequests, updateRequestStatus } from '../repositories/requestRepository.js';

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

export const setUserStatus = async (req, res) => {
  const user = await updateUserStatus(req.params.id, req.body.account_status);
  res.json({ user });
};

export const requests = async (req, res) => {
  res.json({ requests: await listAllRequests() });
};

export const setRequestStatus = async (req, res) => {
  const request = await updateRequestStatus(req.params.id, req.body.status);
  res.json({ request });
};

