#!/usr/bin/env bash
# deploy/deploy.sh
# Pull latest code, install dependencies, build the client, start containers,
# run DB migrations, and restart the Node service.
# Idempotent: safe to re-run for every update.
#
# Usage (as ubuntu):
#   bash /opt/ruby/app/deploy/deploy.sh
#
# The script must be run from ANY directory; it always operates on /opt/ruby/app.
set -euo pipefail

APP_DIR="/opt/ruby/app"
ENV_FILE="/opt/ruby/.env"

echo "==> [deploy] Starting deployment at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# ── Sanity checks ──────────────────────────────────────────────────────────────
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found. Run deploy/render-env.sh first." >&2
  exit 1
fi

# ── Pull latest code ───────────────────────────────────────────────────────────
echo "==> [deploy] Pulling latest code"
cd "${APP_DIR}"
git pull --ff-only

# ── Server dependencies ────────────────────────────────────────────────────────
echo "==> [deploy] Installing server dependencies (npm ci)"
cd "${APP_DIR}/server"
npm ci --omit=dev

# ── Client build ───────────────────────────────────────────────────────────────
# VITE_API_BASE_URL=/api means the client calls /api/... on the same origin,
# going through CloudFront → nginx → Express. This is required for Helmet CSP
# (connectSrc 'self') and avoids CORS issues.
echo "==> [deploy] Installing client dependencies (npm ci)"
cd "${APP_DIR}/client"
npm ci

echo "==> [deploy] Building client with VITE_API_BASE_URL=/api"
VITE_API_BASE_URL=/api npm run build

# ── Start / update PostgreSQL container ───────────────────────────────────────
echo "==> [deploy] Starting Docker containers"
cd "${APP_DIR}"

# Load DB_PASSWORD so docker compose can substitute ${DB_PASSWORD} in compose file.
# shellcheck source=/dev/null
set -a; source "${ENV_FILE}"; set +a

docker compose up -d --remove-orphans

# Wait for PostgreSQL to be ready (up to 30 s).
echo "==> [deploy] Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  if docker exec ruby-postgres pg_isready -U ruby -d ruby_blood -q 2>/dev/null; then
    echo "    PostgreSQL ready after ${i}s"
    break
  fi
  sleep 1
done

# ── Run migrations ─────────────────────────────────────────────────────────────
echo "==> [deploy] Running database migrations"
cd "${APP_DIR}/server"
# shellcheck source=/dev/null
source "${ENV_FILE}"
node src/utils/runMigrations.js

# ── Restart Node service ───────────────────────────────────────────────────────
echo "==> [deploy] Restarting ruby systemd service"
sudo systemctl restart ruby

echo ""
echo "==> [deploy] Deployment complete at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "    Smoke test: curl http://localhost/api/health"
