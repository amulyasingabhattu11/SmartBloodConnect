# Ruby Phase 1 Architecture

Ruby is an Emergency Blood Donor Matching & Coordination Platform. The MVP will focus on deterministic, explainable matching of potential donors to emergency blood requests while protecting sensitive donor information and clearly stating that final medical eligibility must be verified by healthcare professionals or blood banks.

## 1. Proposed Architecture

### Final Technology Choices

- Frontend: React, Vite, JavaScript, React Router, Axios, plain responsive CSS.
- Backend: Node.js, Express.js, JWT authentication, bcrypt password hashing.
- Database: PostgreSQL. PostGIS is preferred for production location queries, with a Haversine fallback implemented in application code.
- Testing: Vitest for backend business logic, Supertest for API tests, React Testing Library for frontend tests later.
- Notifications: In-app notification records first, with provider adapters designed for later email, SMS, and push.
- Deployment shape: `client` and `server` deploy independently. Database connection, secrets, CORS origins, and algorithm settings come from environment variables.

### High-Level System

```text
React Client
  |
  | HTTPS / JSON
  v
Express API
  |
  +-- Auth middleware
  +-- Validation middleware
  +-- Controllers
  +-- Services
  |     +-- Matching service
  |     +-- Notification service
  |     +-- Blood-bank lookup service
  |     +-- Authorization service
  +-- Repositories
  |
  v
PostgreSQL + optional PostGIS
```

### Backend Structure

```text
server/
  src/
    app.js
    server.js
    config/
      db.js
      env.js
      matchingConfig.js
    controllers/
    routes/
    services/
      compatibilityService.js
      eligibilityService.js
      distanceService.js
      matchingService.js
      notificationService.js
      bloodBankService.js
    repositories/
    middleware/
      authMiddleware.js
      requireRole.js
      errorHandler.js
      rateLimiter.js
    validators/
    utils/
    tests/
  migrations/
  seeds/
```

### Frontend Structure

```text
client/
  src/
    main.jsx
    App.jsx
    components/
      layout/
      forms/
      status/
      dashboard/
      matching/
      notifications/
    pages/
      public/
      auth/
      dashboard/
      donor/
      requests/
      admin/
    context/
      AuthContext.jsx
      ToastContext.jsx
    hooks/
    services/
      apiClient.js
      authApi.js
      donorApi.js
      requestApi.js
      notificationApi.js
    utils/
    styles/
```

## 2. Component and Data Flow

### Authentication Flow

1. User registers or logs in from the React client.
2. Express validates input and hashes/verifies passwords with bcrypt.
3. Server returns a JWT plus sanitized user data.
4. Client stores the token in memory plus a controlled persistence option, then sends it in the `Authorization: Bearer <token>` header.
5. Protected API routes decode the token and load the current user before reaching controllers.

### Donor Profile Flow

1. Donor creates or updates profile with blood group, approximate location, availability, and last donation date.
2. Server validates blood group, coordinates, and ownership.
3. Donor profile is stored separately from the user account.
4. Requesters never receive exact donor coordinates, phone, email, or full identity from matching endpoints.

### Request and Matching Flow

1. Requester creates a blood request.
2. Server validates request fields and confirms the required-by time is not already expired.
3. Blood-bank lookup runs first and returns nearby demo inventory options if available.
4. Matching service searches eligible donors by compatibility and location.
5. Smart Radius Expansion widens the radius until enough candidates are found or the max radius is reached.
6. Ranking service assigns Candidate Priority Scores.
7. Top candidates are stored in `donor_matches`.
8. First notification batch is created for the highest-ranked candidates.
9. Donors accept or decline from their notification or match view.
10. Requester dashboard reads live request progress from real database state.

### Notification Flow

1. Matching service calls `notificationService.createInAppNotification`.
2. Notification is persisted with status `SENT`.
3. Donor sees unread notification in dashboard.
4. Accept/decline updates both `donor_matches` and notification state.
5. Requester receives a separate in-app notification when a donor accepts.
6. Later provider adapters can send email, SMS, or push without changing matching logic.

## 3. PostgreSQL Schema and Relationships

### Entity Overview

```text
users 1---0..1 donor_profiles
users 1---many blood_requests
blood_requests 1---many donor_matches
donor_profiles 1---many donor_matches
users 1---many notifications
blood_requests 1---many notifications
blood_banks 1---many blood_inventory
```

### Tables

#### users

- `user_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `name VARCHAR(120) NOT NULL`
- `email VARCHAR(255) NOT NULL UNIQUE`
- `phone VARCHAR(30) NOT NULL`
- `password_hash TEXT NOT NULL`
- `role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN'))`
- `account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'DISABLED'))`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

#### donor_profiles

- `donor_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE`
- `blood_group VARCHAR(3) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))`
- `latitude DECIMAL(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90)`
- `longitude DECIMAL(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180)`
- `location_label VARCHAR(255) NOT NULL`
- `last_donation_date DATE`
- `availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE', 'TEMP_DISABLED'))`
- `response_count INTEGER NOT NULL DEFAULT 0`
- `accept_count INTEGER NOT NULL DEFAULT 0`
- `decline_count INTEGER NOT NULL DEFAULT 0`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Indexes:

- `idx_donor_profiles_blood_group`
- `idx_donor_profiles_availability_status`
- Optional PostGIS generated point column and GiST index in production.

#### blood_requests

- `request_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `requester_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE`
- `patient_reference VARCHAR(120) NOT NULL`
- `required_blood_group VARCHAR(3) NOT NULL CHECK (...)`
- `hospital_name VARCHAR(180) NOT NULL`
- `hospital_address TEXT NOT NULL`
- `latitude DECIMAL(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90)`
- `longitude DECIMAL(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180)`
- `units_required INTEGER NOT NULL CHECK (units_required > 0 AND units_required <= 20)`
- `urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('NORMAL', 'URGENT', 'CRITICAL'))`
- `required_before TIMESTAMPTZ NOT NULL`
- `status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'MATCHING', 'PARTIALLY_MATCHED', 'FULFILLED', 'CANCELLED', 'EXPIRED'))`
- `note TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Indexes:

- `idx_blood_requests_requester_id`
- `idx_blood_requests_status`
- `idx_blood_requests_required_blood_group`
- `idx_blood_requests_required_before`

#### donor_matches

- `match_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `request_id UUID NOT NULL REFERENCES blood_requests(request_id) ON DELETE CASCADE`
- `donor_id UUID NOT NULL REFERENCES donor_profiles(donor_id) ON DELETE CASCADE`
- `distance_km DECIMAL(7,2) NOT NULL`
- `priority_score INTEGER NOT NULL CHECK (priority_score BETWEEN 0 AND 100)`
- `notification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (notification_status IN ('PENDING', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED'))`
- `donor_response VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (donor_response IN ('PENDING', 'ACCEPTED', 'DECLINED'))`
- `batch_number INTEGER`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Constraints:

- `UNIQUE (request_id, donor_id)`

Indexes:

- `idx_donor_matches_request_id`
- `idx_donor_matches_donor_id`
- `idx_donor_matches_priority_score`
- `idx_donor_matches_batch_number`

#### notifications

- `notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE`
- `request_id UUID REFERENCES blood_requests(request_id) ON DELETE CASCADE`
- `match_id UUID REFERENCES donor_matches(match_id) ON DELETE CASCADE`
- `type VARCHAR(40) NOT NULL`
- `title VARCHAR(160) NOT NULL`
- `message TEXT NOT NULL`
- `status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'VIEWED', 'ACCEPTED', 'DECLINED'))`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Indexes:

- `idx_notifications_user_id`
- `idx_notifications_status`
- `idx_notifications_created_at`

#### blood_banks

- `blood_bank_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `name VARCHAR(180) NOT NULL`
- `address TEXT NOT NULL`
- `latitude DECIMAL(9,6) NOT NULL`
- `longitude DECIMAL(9,6) NOT NULL`
- `phone VARCHAR(30)`
- `verified_status VARCHAR(20) NOT NULL DEFAULT 'DEMO' CHECK (verified_status IN ('DEMO', 'UNVERIFIED', 'VERIFIED'))`

#### blood_inventory

- `inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `blood_bank_id UUID NOT NULL REFERENCES blood_banks(blood_bank_id) ON DELETE CASCADE`
- `blood_group VARCHAR(3) NOT NULL CHECK (...)`
- `units_available INTEGER NOT NULL CHECK (units_available >= 0)`
- `last_updated TIMESTAMPTZ NOT NULL DEFAULT now()`

Constraints:

- `UNIQUE (blood_bank_id, blood_group)`

## 4. REST API Plan

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Donors

- `GET /api/donors/profile`
- `POST /api/donors/profile`
- `PUT /api/donors/profile`
- `PATCH /api/donors/availability`
- `GET /api/donors/history`
- `GET /api/donors/nearby-requests`

### Requests

- `POST /api/requests`
- `GET /api/requests`
- `GET /api/requests/:id`
- `PATCH /api/requests/:id/status`
- `GET /api/requests/:id/progress`

### Matching

- `POST /api/requests/:id/match`
- `GET /api/requests/:id/matches`
- `POST /api/requests/:id/notify-next-batch`

### Donor Responses

- `POST /api/matches/:id/accept`
- `POST /api/matches/:id/decline`

### Notifications

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

### Blood Banks

- `GET /api/blood-banks/nearby?lat=&lng=&bloodGroup=`
- `GET /api/blood-banks/:id/inventory`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/requests`
- `PATCH /api/admin/requests/:id/status`

## 5. Donor Matching Algorithm Pseudocode

```text
matchRequest(requestId):
  request = load request

  if request is not OPEN or MATCHING:
    throw useful domain error

  if request.required_before <= now:
    mark request EXPIRED
    throw "This request has expired."

  set request status MATCHING

  bloodBankOptions = find nearby demo blood-bank inventory

  allCandidateResults = []
  finalRadius = null

  for radiusKm in configuredRadiusSteps:
    donorPool = find donors within radiusKm

    compatibleDonors = donorPool where
      isCompatibleForRbcDonation(donor.blood_group, request.required_blood_group)

    eligibleDonors = compatibleDonors where
      donor is available
      donor user account is ACTIVE
      donor has not already accepted/declined this request
      donor last donation date passes configured recency rule if enabled

    scoredCandidates = eligibleDonors map calculatePriorityScore
    sortedCandidates = sort scoredCandidates by priority_score desc, distance asc

    if sortedCandidates.length >= targetCandidateCount(request.units_required, request.urgency):
      allCandidateResults = sortedCandidates
      finalRadius = radiusKm
      break

    allCandidateResults = sortedCandidates
    finalRadius = radiusKm

  upsert donor_matches for candidates
  create first notification batch for top candidates

  return:
    finalRadius
    candidateCount
    notifiedCount
    approximateDistancesOnly
    bloodBankOptions
```

## 6. Candidate Priority Score Formula

The score means operational priority for contacting a potential donor. It does not mean medical clearance, transfusion safety, or likelihood of successful donation.

Default configurable weights:

- Distance: 40%
- Preliminary eligibility and donation recency: 30%
- Response reliability: 20%
- Operational urgency fit: 10%

Blood compatibility and availability are mandatory filters, not score boosts.

```text
distanceScore = max(0, 100 - ((distanceKm / currentRadiusKm) * 100))

recencyScore:
  if last_donation_date is null: 70
  else if days_since_last_donation >= MIN_DONATION_INTERVAL_DAYS: 100
  else: 0

reliabilityScore:
  if response_count = 0: 70
  else: round((accept_count / response_count) * 100)

urgencyFitScore:
  AVAILABLE donors: 100
  other availability states are filtered out

priorityScore =
  distanceScore * WEIGHT_DISTANCE +
  recencyScore * WEIGHT_RECENCY +
  reliabilityScore * WEIGHT_RELIABILITY +
  urgencyFitScore * WEIGHT_URGENCY_FIT

normalizedPriorityScore = clamp(round(priorityScore), 0, 100)
```

Configuration belongs in one file or environment-backed config:

- `MATCH_RADIUS_STEPS_KM=5,10,20,30`
- `MATCH_BATCH_SIZE=5`
- `MATCH_EXTRA_CANDIDATES_PER_UNIT=4`
- `MIN_DONATION_INTERVAL_DAYS=90`
- `MATCH_WEIGHT_DISTANCE=0.40`
- `MATCH_WEIGHT_RECENCY=0.30`
- `MATCH_WEIGHT_RELIABILITY=0.20`
- `MATCH_WEIGHT_URGENCY_FIT=0.10`

The recency rule must be displayed as a configurable preliminary operational rule, not a final medical eligibility decision.

## 7. Smart Radius Expansion Algorithm

```text
radiusSteps = [5, 10, 20, 30]
targetCandidates = max(batchSize, unitsRequired * extraCandidatesPerUnit)

if urgency is CRITICAL:
  response window is shorter and first batch may be created immediately
else:
  same radius steps, normal response window

for radius in radiusSteps:
  candidates = filter and score donors within radius
  if candidates.length >= targetCandidates:
    stop and use this radius

if no radius satisfies target:
  use all suitable candidates found within max radius

if zero suitable candidates:
  return "No suitable potential donors were found within 30 km."
```

This stays deterministic and explainable. Critical urgency changes operational timing, not medical rules.

## 8. Privacy and Security Strategy

### Privacy

- Requesters see donor display IDs, blood group, approximate distance, availability, and Candidate Priority Score only.
- Exact donor coordinates are never returned to requester-facing endpoints.
- Donor phone and email are hidden unless a future consent-based contact workflow is implemented.
- Blood-bank inventory is labeled as demo or stale unless connected to a verified real-time provider.
- Every matching screen displays: "Preliminary candidate only - final donor eligibility must be verified by the blood bank or healthcare provider."

### Security

- Passwords are hashed with bcrypt.
- JWT secret, database credentials, CORS origins, and algorithm settings come from environment variables.
- Auth middleware protects private endpoints.
- Ownership checks prevent users from modifying other users' requests, profiles, matches, and notifications.
- Admin routes require `role = ADMIN`.
- Input validation blocks invalid email, phone, blood group, coordinates, units, urgency, statuses, expired request creation, and duplicate donor responses.
- Parameterized SQL or query-builder-safe repository methods are required.
- Rate limiting applies to login, register, and sensitive write endpoints.
- Helmet sets secure HTTP headers.
- Production error responses do not expose stack traces.

## 9. Frontend Page and Component Hierarchy

```text
App
  PublicLayout
    LandingPage
    AboutPage
    HowItWorksPage
    LoginPage
    RegisterPage

  ProtectedLayout
    DashboardHomePage
      DashboardStatCards
      RecentActivityList
      DonorAvailabilityToggle
      ActiveRequestSummary

    CreateBloodRequestPage
      BloodRequestForm
      BloodBankOptionsPanel
      MedicalDisclaimerBanner

    MyRequestsPage
      RequestFilters
      RequestList
      EmptyState

    RequestDetailsPage
      RequestHeader
      MatchingProgress
      CandidateSummaryTable
      ResponseTimeline
      NotifyNextBatchButton
      CancelOrCloseRequestActions

    DonorProfilePage
      DonorProfileForm
      AvailabilityCard
      PrivacyNotice

    NearbyRequestsPage
      NearbyRequestList

    NotificationsPage
      NotificationList
      AcceptDeclineActions

    DonationHistoryPage
      ResponseHistoryTable

    SettingsPage

  AdminLayout
    AdminDashboardPage
    AdminUsersPage
    AdminRequestsPage
    AdminStatsPage
```

Reusable components:

- `StatusBadge`
- `UrgencyBadge`
- `ProgressBar`
- `FormField`
- `ConfirmDialog`
- `Toast`
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `MedicalDisclaimerBanner`
- `ApproxDistance`

## 10. Development Roadmap

### Phase 2 - Foundation

- Create `client` and `server` projects.
- Add Express app, database connection, migrations, seed runner, and environment config.
- Implement auth, protected routes, common middleware, and frontend routing.

### Phase 3 - Donor System

- Implement donor profile CRUD.
- Implement availability toggling.
- Build donor dashboard panels.

### Phase 4 - Blood Requests

- Implement request creation, request list, request details, and status management.
- Add requester dashboard progress shell backed by real API state.

### Phase 5 - Matching Engine

- Implement compatibility, eligibility, distance, smart radius, and ranking services.
- Add unit tests for business logic.

### Phase 6 - Notifications

- Implement notification records, first batch, next batch, accept, decline, duplicate response prevention, and requester progress updates.

### Phase 7 - Blood Banks

- Add blood-bank tables, seed data, nearby lookup, freshness labels, and UI panel.

### Phase 8 - UI Polish

- Add responsive styling, loading states, empty states, error states, confirmation dialogs, visual dashboard polish, and accessibility pass.

### Phase 9 - Testing

- Add unit, API, and workflow tests for core behavior and edge cases.

### Phase 10 - Documentation and Deployment Preparation

- Add README, `.env.example`, Docker Compose, seed instructions, testing instructions, security notes, and deployment notes.

## Assumptions

- The project name shown to users is Ruby, even if the repository folder remains `SmartBloodConnect`.
- A user can act as both requester and donor. Admin is represented as a user role.
- Location input for MVP uses manually entered latitude and longitude plus a general location label. Geocoding can be added later behind a provider abstraction.
- PostGIS will be supported in schema/config, but Haversine fallback will keep local development simple.
- In-app notifications are enough for MVP. Email, SMS, and push are future provider adapters.
- Seed data will be fictional and clearly labeled as demo data.

## Phase 1 Handoff

### Files Created or Modified

- `docs/PHASE_1_ARCHITECTURE.md`

### Important Implementation Decisions

- Business logic will live in backend services, not route files or React components.
- Compatibility is deterministic and independently testable.
- Candidate Priority Score is operational, not medical.
- Privacy is enforced at the API response level by excluding exact donor coordinates and private contact fields.
- Smart Radius Expansion uses configurable radius steps and deterministic stopping rules.

### Commands Required to Run or Test

No application runtime exists yet in Phase 1. Useful repository commands:

```bash
git status --short
```

### Unresolved Issues

- No code has been generated yet because Phase 1 is architecture only.
- Maps/geocoding provider is intentionally not selected yet to avoid hardcoding API-key-dependent design.
- PostgreSQL migration tooling will be chosen in Phase 2.

### Verification

- Repository was inspected before creating this document.
- The working tree had no tracked changes before Phase 1 documentation was added.
- No application tests can run yet because the codebase has not been scaffolded.
