# Ruby - Emergency Blood Donor Matching & Coordination Platform

Ruby is a production-style full-stack web application for coordinating emergency blood donor outreach. It helps requesters create urgent blood requests, identifies suitable nearby potential donors using deterministic rules, sends in-app notifications in batches, and tracks donor responses.

Ruby does not medically clear donors and does not guarantee transfusion safety. Final donor eligibility and blood compatibility must be verified by qualified healthcare professionals or blood banks.

## Features

- JWT authentication with bcrypt password hashing.
- Donor profile and availability management.
- Timestamped GPS capture with accuracy and stale-location filtering.
- Emergency blood request creation and tracking.
- Deterministic red-blood-cell compatibility engine.
- Preliminary eligibility filtering.
- Haversine distance calculation with PostGIS-ready PostgreSQL setup.
- Smart Radius Expansion: 5 km, 10 km, 20 km, 30 km.
- Candidate Priority Score based on distance, recency, reliability, and availability.
- In-app notification records and accept/decline workflow.
- Batch notifications to avoid alerting every donor at once.
- Demo blood-bank inventory with freshness labels.
- Admin dashboard for users, requests, and system statistics.
- Admin-only donor location registry with freshness indicators and map links.
- Responsive React UI.

## Architecture

```text
client/ React + Vite + React Router + Axios
server/ Node.js + Express + PostgreSQL
server/src/services/ deterministic matching and notification logic
server/migrations/ PostgreSQL schema
server/seeds/ fictional demo data
```

See [docs/PHASE_1_ARCHITECTURE.md](docs/PHASE_1_ARCHITECTURE.md) for the full design.

## Matching Algorithm

When a request is created, Ruby:

1. Validates the request and required-by time.
2. Finds RBC-compatible donor blood groups.
3. Filters unavailable donors, inactive accounts, duplicate responses, and donors failing the configurable donation recency rule.
4. Calculates distance from donor area to hospital using Haversine.
5. Expands search radius through `5,10,20,30` km until enough candidates are found.
6. Scores candidates from 0 to 100.
7. Stores matches and notifies the first batch.

Candidate Priority Score is an operational contact priority only. It does not represent medical compatibility probability or safety.

## Local Setup

Requirements:

- Node.js 18+
- Docker Desktop, or a local PostgreSQL database

Install dependencies:

```bash
npm run install:all
```

Start PostgreSQL with PostGIS:

```bash
docker compose up -d
```

Copy environment file:

```bash
copy .env.example server\.env
copy .env.example client\.env
```

Run migrations and seed demo data:

```bash
npm run migrate
npm run seed
```

Start both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend health check: `http://localhost:5000/api/health`

## Native Windows PostgreSQL Setup (No Docker)

PostgreSQL is not currently installed or listening on port `5432` on this computer. Ruby supports a normal local PostgreSQL installation; PostGIS is optional.

1. Install PostgreSQL 16 or newer using the official Windows installer. Keep port `5432` and remember the password chosen for the `postgres` user.
2. Open **SQL Shell (psql)** or pgAdmin and create the database:

```sql
CREATE DATABASE ruby_blood;
```

3. Update `server/.env`:

```env
NODE_ENV=development
DEMO_MODE=false
PORT=5000
CLIENT_ORIGIN=http://localhost:5000
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/ruby_blood
DATABASE_SSL=false
JWT_SECRET=replace-this-with-a-random-secret-at-least-32-characters-long
```

Percent-encode special characters in the password when placing it in `DATABASE_URL`.

4. Verify the connection and create the schema:

```powershell
npm run db:check
npm run migrate
```

5. Optional: load fictional accounts. This clears existing application tables, so use it only on a disposable development database:

```powershell
npm run seed
```

6. Build and run the database-backed app:

```powershell
npm run app
```

Open `http://localhost:5000`. The health endpoint must report `"mode":"database"` and `"database":"connected"`.

## Run Without PostgreSQL or Docker

For a temporary local demo, enable in-memory mode. Data resets whenever the backend restarts, but the UI, auth, donor profiles, request creation, matching, notifications, and admin pages can be tried without PostgreSQL.

Create `server/.env` and set:

```env
DEMO_MODE=true
JWT_SECRET=local-demo-secret
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
```

Then run:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Demo Accounts

Seeded users use:

```text
Password123!
```

Examples:

- `admin@ruby.demo`
- `asha@ruby.demo`
- `dev@ruby.demo`

## Testing

```bash
npm test
```

Current tests cover:

- Blood compatibility rules.
- Distance calculation.
- Candidate Priority Score behavior.

## Security and Privacy

- Passwords are never stored in plain text.
- JWT secrets and database credentials belong in environment variables.
- Real database mode refuses to start unless `JWT_SECRET` is set to a strong non-default value.
- API routes use security headers, CORS origin checks, JSON size limits, and rate limiting.
- Requesters do not receive exact donor coordinates, phone numbers, email addresses, or private contact details.
- Donor contact details are revealed only after the donor accepts the request.
- Ownership checks prevent users from modifying other users' requests or donor responses.
- Admin endpoints require admin role.
- Administrator accounts cannot create donor profiles or respond as donors.
- Donor locations older than `MATCH_LOCATION_MAX_AGE_MINUTES` are excluded from matching.
- Validation rejects invalid blood groups, coordinates, units, urgency, and expired requests.

## Production Security Checklist

- Set `DEMO_MODE=false`.
- Use a 32+ character random `JWT_SECRET`.
- Use HTTPS in deployment.
- Set `CLIENT_ORIGIN` to the exact frontend domain.
- Use managed PostgreSQL credentials from a secret manager.
- Disable seeded demo users in production.
- Review logs for repeated failed login/contact attempts.
- Do not expose donor exact coordinates or contact details before donor consent.

## Limitations

- In-app notifications are implemented first. SMS, email, and push are provider-ready future additions.
- Demo blood-bank inventory is not real-time and must be verified.
- Geocoding is not integrated yet; MVP accepts location labels plus coordinates.
- Background job scheduling is intentionally deferred; next-batch notification is manual.

## Future Improvements

- SMS/email/Firebase push notification adapters.
- WebSocket live updates.
- AWS deployment templates.
- Verified blood-bank API integrations.
- Hospital and NGO accounts.
- Multilingual interface.
- ML-based response likelihood prediction only after enough real operational data exists.
