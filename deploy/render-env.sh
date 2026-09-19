#!/usr/bin/env bash
# deploy/render-env.sh
# Reads /ruby/* SecureString parameters from AWS SSM Parameter Store
# and writes /opt/ruby/.env (chmod 600, owner ubuntu).
#
# Prerequisites:
#   - Instance IAM role must have ssm:GetParameter* on arn:aws:ssm:<region>:<acct>:parameter/ruby/*
#   - AWS_REGION env var must be set, or the instance region is used automatically by the CLI
#   - The caller must supply CLIENT_ORIGIN and SNS_TOPIC_ARN as env vars, OR
#     they must already exist as SSM parameters /ruby/CLIENT_ORIGIN and /ruby/SNS_TOPIC_ARN
#
# Usage (first deploy, before CloudFront URL is known):
#   CLIENT_ORIGIN=http://placeholder SNS_TOPIC_ARN=arn:... bash deploy/render-env.sh
#
# Usage (after CloudFront is created):
#   CLIENT_ORIGIN=https://<id>.cloudfront.net SNS_TOPIC_ARN=arn:... bash deploy/render-env.sh
set -euo pipefail

REGION="${AWS_REGION:-ap-south-1}"
ENV_FILE="/opt/ruby/.env"

echo "==> [render-env] Reading secrets from SSM (region: ${REGION})"

fetch_param() {
  local name="$1"
  aws ssm get-parameter \
    --region "${REGION}" \
    --name "${name}" \
    --with-decryption \
    --query "Parameter.Value" \
    --output text
}

JWT_SECRET="$(fetch_param /ruby/JWT_SECRET)"
DB_PASSWORD="$(fetch_param /ruby/DB_PASSWORD)"

# CLIENT_ORIGIN and SNS_TOPIC_ARN can be passed as env vars (preferred during first deploy)
# or stored in SSM as /ruby/CLIENT_ORIGIN and /ruby/SNS_TOPIC_ARN.
if [[ -z "${CLIENT_ORIGIN:-}" ]]; then
  CLIENT_ORIGIN="$(fetch_param /ruby/CLIENT_ORIGIN)"
fi
if [[ -z "${SNS_TOPIC_ARN:-}" ]]; then
  SNS_TOPIC_ARN="$(fetch_param /ruby/SNS_TOPIC_ARN)"
fi

echo "==> [render-env] Writing ${ENV_FILE}"

# Write atomically via a temp file so a partial write never corrupts the live env.
TMP_FILE="$(mktemp)"
cat > "${TMP_FILE}" <<EOF
NODE_ENV=production
DEMO_MODE=false
PORT=5000

CLIENT_ORIGIN=${CLIENT_ORIGIN}

DATABASE_URL=postgres://ruby:${DB_PASSWORD}@127.0.0.1:5432/ruby_blood
DATABASE_SSL=false
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT_MS=5000

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

AWS_REGION=${REGION}
ALERTS_ENABLED=true
SNS_TOPIC_ARN=${SNS_TOPIC_ARN}

DB_PASSWORD=${DB_PASSWORD}
EOF

# Secure the temp file before moving it into place.
chmod 600 "${TMP_FILE}"
mv "${TMP_FILE}" "${ENV_FILE}"
chown ubuntu:ubuntu "${ENV_FILE}"

echo "==> [render-env] Done. ${ENV_FILE} written (chmod 600)."
echo "    Review with: sudo cat ${ENV_FILE}"
