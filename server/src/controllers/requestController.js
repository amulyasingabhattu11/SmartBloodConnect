import { AppError } from '../utils/AppError.js';
import { bloodRequestSchema, requestStatusSchema } from '../validators/schemas.js';
import {
  createBloodRequest,
  findRequestById,
  getDashboardStats,
  getRequestProgress,
  listRequestsForUser,
  updateRequestStatus
} from '../repositories/requestRepository.js';
import { listMatchesForRequest } from '../repositories/matchRepository.js';
import { runMatchingForRequest, notifyNextBatch } from '../services/matchingService.js';

const ensureOwnerOrAdmin = (request, user) => {
  if (request.requester_id !== user.user_id && user.role !== 'ADMIN') {
    throw new AppError('You are not allowed to access this blood request.', 403);
  }
};

export const createRequest = async (req, res) => {
  const payload = bloodRequestSchema.parse(req.body);
  if (new Date(payload.required_before).getTime() <= Date.now()) {
    throw new AppError('Required-by time must be in the future.', 422);
  }
  const request = await createBloodRequest(req.user.user_id, payload);
  const matching = await runMatchingForRequest(request.request_id);
  res.status(201).json({ request: await findRequestById(request.request_id), matching });
};

export const listMyRequests = async (req, res) => {
  const requests = await listRequestsForUser(req.user.user_id);
  res.json({ requests });
};

export const getRequest = async (req, res) => {
  const request = await findRequestById(req.params.id);
  if (!request) throw new AppError('Blood request was not found.', 404);
  ensureOwnerOrAdmin(request, req.user);
  const progress = await getRequestProgress(req.params.id);
  const matches = await listMatchesForRequest(req.params.id);
  res.json({ request, progress, matches });
};

export const changeRequestStatus = async (req, res) => {
  const payload = requestStatusSchema.parse(req.body);
  const request = await findRequestById(req.params.id);
  if (!request) throw new AppError('Blood request was not found.', 404);
  ensureOwnerOrAdmin(request, req.user);
  const updated = await updateRequestStatus(req.params.id, payload.status);
  res.json({ request: updated });
};

export const matchRequest = async (req, res) => {
  const request = await findRequestById(req.params.id);
  if (!request) throw new AppError('Blood request was not found.', 404);
  ensureOwnerOrAdmin(request, req.user);
  const matching = await runMatchingForRequest(req.params.id);
  res.json({ matching });
};

export const getMatches = async (req, res) => {
  const request = await findRequestById(req.params.id);
  if (!request) throw new AppError('Blood request was not found.', 404);
  ensureOwnerOrAdmin(request, req.user);
  const matches = await listMatchesForRequest(req.params.id);
  res.json({ matches });
};

export const notifyNext = async (req, res) => {
  const request = await findRequestById(req.params.id);
  if (!request) throw new AppError('Blood request was not found.', 404);
  ensureOwnerOrAdmin(request, req.user);
  const result = await notifyNextBatch(req.params.id);
  res.json(result);
};

export const dashboard = async (req, res) => {
  const stats = await getDashboardStats(req.user.user_id);
  const requests = await listRequestsForUser(req.user.user_id);
  res.json({ stats, recent_requests: requests.slice(0, 5) });
};

