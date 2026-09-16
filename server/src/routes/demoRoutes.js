import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt.js';
import { verifyToken } from '../utils/jwt.js';
import { calculateDistanceKm } from '../services/distanceService.js';
import { compatibleDonorGroupsForRecipient, isCompatibleForRbcDonation } from '../services/compatibilityService.js';
import { calculatePriorityScore } from '../services/rankingService.js';
import { AppError } from '../utils/AppError.js';

export const demoRoutes = Router();

let idCounter = 100;
const id = (prefix) => `${prefix}-${idCounter++}`;
const demoHash = bcrypt.hashSync('Password123!', 10);

const db = {
  users: [
    { user_id: 'user-admin', name: 'Ruby Admin', email: 'admin@ruby.demo', phone: '+910000000001', password_hash: demoHash, role: 'ADMIN', account_status: 'ACTIVE' },
    { user_id: 'user-asha', name: 'Asha Requester', email: 'asha@ruby.demo', phone: '+910000000002', password_hash: demoHash, role: 'USER', account_status: 'ACTIVE' },
    { user_id: 'user-dev', name: 'Dev Donor', email: 'dev@ruby.demo', phone: '+910000000003', password_hash: demoHash, role: 'USER', account_status: 'ACTIVE' },
    { user_id: 'user-mina', name: 'Mina Donor', email: 'mina@ruby.demo', phone: '+910000000004', password_hash: demoHash, role: 'USER', account_status: 'ACTIVE' }
  ],
  donors: [
    { donor_id: 'donor-dev', user_id: 'user-dev', blood_group: 'B+', latitude: 17.444, longitude: 78.377, location_label: 'HITEC City demo area', last_donation_date: '2025-01-01', availability_status: 'AVAILABLE', response_count: 8, accept_count: 6, decline_count: 2 },
    { donor_id: 'donor-mina', user_id: 'user-mina', blood_group: 'O+', latitude: 17.43, longitude: 78.41, location_label: 'Jubilee Hills demo area', last_donation_date: '2025-02-01', availability_status: 'AVAILABLE', response_count: 4, accept_count: 3, decline_count: 1 }
  ],
  requests: [
    { request_id: 'request-demo', requester_id: 'user-asha', patient_reference: 'Patient R-102', required_blood_group: 'B+', hospital_name: 'Ruby Demo Hospital', hospital_address: 'Madhapur demo hospital zone', latitude: 17.4485, longitude: 78.3908, units_required: 2, urgency: 'CRITICAL', required_before: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), status: 'MATCHING', note: 'Demo emergency request', created_at: new Date().toISOString() }
  ],
  matches: [],
  notifications: [],
  banks: [
    { blood_bank_id: 'bank-1', name: 'DEMO Ruby City Blood Bank', address: 'Demo medical district', latitude: 17.44, longitude: 78.395, phone: '+910000000101', verified_status: 'DEMO', blood_group: 'B+', units_available: 3, last_updated: new Date(Date.now() - 42 * 60 * 1000).toISOString() }
  ]
};

const safeUser = (user) => {
  const { password_hash, ...safe } = user;
  return safe;
};

const requireDemoAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next(new AppError('Authentication token is required.', 401));
    const payload = verifyToken(header.slice('Bearer '.length));
    const user = db.users.find((item) => item.user_id === payload.userId);
    if (!user || user.account_status !== 'ACTIVE') return next(new AppError('Your account is not active.', 403));
    req.user = safeUser(user);
    next();
  } catch {
    next(new AppError('Invalid or expired authentication token.', 401));
  }
};

const requireDemoAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') return next(new AppError('Administrator access is required.', 403));
  next();
};

const progressFor = (requestId) => {
  const matches = db.matches.filter((match) => match.request_id === requestId);
  return {
    candidates_identified: matches.length,
    notified: matches.filter((match) => ['SENT', 'VIEWED', 'ACCEPTED', 'DECLINED'].includes(match.notification_status)).length,
    accepted: matches.filter((match) => match.donor_response === 'ACCEPTED').length,
    declined: matches.filter((match) => match.donor_response === 'DECLINED').length,
    pending: matches.filter((match) => ['SENT', 'VIEWED'].includes(match.notification_status)).length
  };
};

const runDemoMatching = (request) => {
  const groups = compatibleDonorGroupsForRecipient(request.required_blood_group);
  const candidates = db.donors
    .filter((donor) => groups.includes(donor.blood_group) && donor.availability_status === 'AVAILABLE')
    .map((donor) => {
      const distance_km = calculateDistanceKm(request, donor);
      return { donor, distance_km, priority_score: calculatePriorityScore({ donor, distanceKm: distance_km, radiusKm: 30 }) };
    })
    .filter((candidate) => candidate.distance_km <= 30)
    .sort((a, b) => b.priority_score - a.priority_score || a.distance_km - b.distance_km);

  candidates.forEach((candidate, index) => {
    if (db.matches.some((match) => match.request_id === request.request_id && match.donor_id === candidate.donor.donor_id)) return;
    const match = {
      match_id: id('match'),
      request_id: request.request_id,
      donor_id: candidate.donor.donor_id,
      distance_km: candidate.distance_km,
      priority_score: candidate.priority_score,
      notification_status: index < 5 ? 'SENT' : 'PENDING',
      donor_response: 'PENDING',
      batch_number: index < 5 ? 1 : null
    };
    db.matches.push(match);
    if (index < 5) {
      db.notifications.push({
        notification_id: id('notification'),
        user_id: candidate.donor.user_id,
        request_id: request.request_id,
        match_id: match.match_id,
        type: 'DONOR_EMERGENCY_REQUEST',
        title: 'Urgent blood request',
        message: `${request.required_blood_group} needed at ${request.hospital_name}. Approximate distance: ${candidate.distance_km.toFixed(1)} km. Urgency: ${request.urgency}.`,
        status: 'SENT',
        created_at: new Date().toISOString()
      });
    }
  });

  return {
    final_radius_km: 30,
    candidate_count: candidates.length,
    notified_count: Math.min(candidates.length, 5),
    progress: progressFor(request.request_id),
    blood_bank_options: db.banks.filter((bank) => bank.blood_group === request.required_blood_group),
    message: candidates.length ? 'Demo candidates identified and notified.' : 'No suitable potential donors were found within 30 km.'
  };
};

runDemoMatching(db.requests[0]);

demoRoutes.post('/auth/register', async (req, res) => {
  const user = { user_id: id('user'), ...req.body, email: req.body.email.toLowerCase(), password_hash: await bcrypt.hash(req.body.password, 10), role: 'USER', account_status: 'ACTIVE' };
  db.users.push(user);
  res.status(201).json({ user: safeUser(user), token: signToken(user) });
});

demoRoutes.post('/auth/login', async (req, res, next) => {
  const user = db.users.find((item) => item.email === String(req.body.email).toLowerCase());
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) return next(new AppError('Invalid email or password.', 401));
  res.json({ user: safeUser(user), token: signToken(user) });
});

demoRoutes.get('/auth/me', requireDemoAuth, (req, res) => res.json({ user: req.user }));
demoRoutes.post('/auth/logout', requireDemoAuth, (req, res) => res.json({ message: 'Logged out.' }));

demoRoutes.get('/donors/profile', requireDemoAuth, (req, res) => res.json({ profile: db.donors.find((donor) => donor.user_id === req.user.user_id) || null }));
demoRoutes.post('/donors/profile', requireDemoAuth, (req, res) => {
  let profile = db.donors.find((donor) => donor.user_id === req.user.user_id);
  if (profile) Object.assign(profile, req.body);
  else {
    profile = { donor_id: id('donor'), user_id: req.user.user_id, response_count: 0, accept_count: 0, decline_count: 0, ...req.body };
    db.donors.push(profile);
  }
  res.json({ profile });
});
demoRoutes.put('/donors/profile', requireDemoAuth, (req, res) => {
  let profile = db.donors.find((donor) => donor.user_id === req.user.user_id);
  if (profile) Object.assign(profile, req.body);
  else {
    profile = { donor_id: id('donor'), user_id: req.user.user_id, response_count: 0, accept_count: 0, decline_count: 0, ...req.body };
    db.donors.push(profile);
  }
  res.json({ profile });
});
demoRoutes.patch('/donors/availability', requireDemoAuth, (req, res, next) => {
  const profile = db.donors.find((donor) => donor.user_id === req.user.user_id);
  if (!profile) return next(new AppError('Create a donor profile before changing availability.', 404));
  profile.availability_status = req.body.availability_status;
  res.json({ profile });
});
demoRoutes.get('/donors/history', requireDemoAuth, (req, res) => {
  const profile = db.donors.find((donor) => donor.user_id === req.user.user_id);
  const history = profile ? db.matches.filter((match) => match.donor_id === profile.donor_id) : [];
  res.json({ history });
});
demoRoutes.get('/donors/nearby-requests', requireDemoAuth, (req, res) => {
  const profile = db.donors.find((donor) => donor.user_id === req.user.user_id);
  const requests = profile ? db.requests.filter((request) => isCompatibleForRbcDonation(profile.blood_group, request.required_blood_group)) : [];
  res.json({ requests });
});

demoRoutes.get('/requests/dashboard', requireDemoAuth, (req, res) => {
  const own = db.requests.filter((request) => request.requester_id === req.user.user_id);
  res.json({ stats: { active_requests: own.filter((r) => !['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(r.status)).length, completed_requests: own.filter((r) => r.status === 'FULFILLED').length }, recent_requests: own.slice(0, 5) });
});
demoRoutes.get('/requests', requireDemoAuth, (req, res) => {
  const requests = db.requests.filter((request) => request.requester_id === req.user.user_id).map((request) => ({ ...request, candidate_count: progressFor(request.request_id).candidates_identified, accepted_count: progressFor(request.request_id).accepted }));
  res.json({ requests });
});
demoRoutes.post('/requests', requireDemoAuth, (req, res) => {
  const request = { request_id: id('request'), requester_id: req.user.user_id, status: 'MATCHING', created_at: new Date().toISOString(), ...req.body };
  db.requests.unshift(request);
  const matching = runDemoMatching(request);
  res.status(201).json({ request, matching });
});
demoRoutes.get('/requests/:id', requireDemoAuth, (req, res, next) => {
  const request = db.requests.find((item) => item.request_id === req.params.id);
  if (!request) return next(new AppError('Blood request was not found.', 404));
  const matches = db.matches.filter((match) => match.request_id === request.request_id).map((match) => {
    const donor = db.donors.find((item) => item.donor_id === match.donor_id);
    return { ...match, blood_group: donor.blood_group, availability_status: donor.availability_status, donor_label: `Donor #${donor.donor_id.slice(-4)}` };
  });
  res.json({ request, progress: progressFor(request.request_id), matches });
});
demoRoutes.patch('/requests/:id/status', requireDemoAuth, (req, res, next) => {
  const request = db.requests.find((item) => item.request_id === req.params.id);
  if (!request) return next(new AppError('Blood request was not found.', 404));
  request.status = req.body.status;
  res.json({ request });
});
demoRoutes.post('/requests/:id/match', requireDemoAuth, (req, res, next) => {
  const request = db.requests.find((item) => item.request_id === req.params.id);
  if (!request) return next(new AppError('Blood request was not found.', 404));
  res.json({ matching: runDemoMatching(request) });
});
demoRoutes.get('/requests/:id/matches', requireDemoAuth, (req, res) => res.json({ matches: db.matches.filter((match) => match.request_id === req.params.id) }));
demoRoutes.post('/requests/:id/notify-next-batch', requireDemoAuth, (req, res) => {
  const next = db.matches.filter((match) => match.request_id === req.params.id && match.notification_status === 'PENDING').slice(0, 5);
  next.forEach((match) => { match.notification_status = 'SENT'; match.batch_number = (match.batch_number || 1) + 1; });
  res.json({ notified_count: next.length, batch_number: 2 });
});

const respond = (req, res, next, response) => {
  const match = db.matches.find((item) => item.match_id === req.params.id);
  if (!match) return next(new AppError('Match was not found.', 404));
  match.donor_response = response;
  match.notification_status = response;
  const donor = db.donors.find((item) => item.donor_id === match.donor_id);
  donor.response_count += 1;
  if (response === 'ACCEPTED') donor.accept_count += 1;
  if (response === 'DECLINED') donor.decline_count += 1;
  const notification = db.notifications.find((item) => item.match_id === match.match_id);
  if (notification) notification.status = response;
  res.json({ match, progress: progressFor(match.request_id) });
};

demoRoutes.post('/matches/:id/accept', requireDemoAuth, (req, res, next) => respond(req, res, next, 'ACCEPTED'));
demoRoutes.post('/matches/:id/decline', requireDemoAuth, (req, res, next) => respond(req, res, next, 'DECLINED'));
demoRoutes.get('/matches/:id/contact', requireDemoAuth, (req, res, next) => {
  const match = db.matches.find((item) => item.match_id === req.params.id);
  if (!match) return next(new AppError('Match was not found.', 404));
  const request = db.requests.find((item) => item.request_id === match.request_id);
  if (request.requester_id !== req.user.user_id && req.user.role !== 'ADMIN') return next(new AppError('You are not allowed to contact this donor.', 403));
  const donor = db.donors.find((item) => item.donor_id === match.donor_id);
  const user = db.users.find((item) => item.user_id === donor.user_id);
  res.json({
    contact: {
      donor_label: `Donor #${donor.donor_id.slice(-4)}`,
      name: user.name,
      phone: user.phone,
      email: user.email,
      blood_group: donor.blood_group,
      current_address: donor.location_label,
      note: 'Contact details are shown for coordination only. Final donor eligibility must be verified by healthcare professionals.'
    }
  });
});
demoRoutes.get('/notifications', requireDemoAuth, (req, res) => res.json({ notifications: db.notifications.filter((item) => item.user_id === req.user.user_id) }));
demoRoutes.patch('/notifications/:id/read', requireDemoAuth, (req, res, next) => {
  const notification = db.notifications.find((item) => item.notification_id === req.params.id);
  if (!notification) return next(new AppError('Notification was not found.', 404));
  notification.status = 'VIEWED';
  res.json({ notification });
});

demoRoutes.get('/blood-banks/nearby', requireDemoAuth, (req, res) => res.json({ demo_data_notice: 'Demo mode inventory only.', banks: db.banks }));
demoRoutes.get('/blood-banks/:id/inventory', requireDemoAuth, (req, res) => res.json({ demo_data_notice: 'Demo mode inventory only.', inventory: db.banks.filter((bank) => bank.blood_bank_id === req.params.id) }));
demoRoutes.get('/admin/stats', requireDemoAuth, requireDemoAdmin, (req, res) => res.json({ stats: { users: db.users.length, donors: db.donors.length, active_requests: db.requests.length, accepted_matches: db.matches.filter((m) => m.donor_response === 'ACCEPTED').length } }));
demoRoutes.get('/admin/users', requireDemoAuth, requireDemoAdmin, (req, res) => res.json({ users: db.users.map(safeUser) }));
demoRoutes.get('/admin/requests', requireDemoAuth, requireDemoAdmin, (req, res) => res.json({ requests: db.requests.map((request) => ({ ...request, requester_name: db.users.find((user) => user.user_id === request.requester_id)?.name })) }));
