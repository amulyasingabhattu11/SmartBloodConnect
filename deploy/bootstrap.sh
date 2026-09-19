#!/usr/bin/env bash
# deploy/bootstrap.sh
# One-time setup for a fresh Ubuntu 24.04 EC2 instance.
# Idempotent: safe to run again if something failed halfway.
# Usage: sudo bash deploy/bootstrap.sh
set -euo pipefail

echo "==> [bootstrap] Starting one-time instance setup"

# ── System packages ────────────────────────────────────────────────────────────
apt-get update -y
apt-get install -y \
  curl \
  git \
  unzip \
  ca-certificates \
  gnupg \
  lsb-release

# ── Node 20 (NodeSource) ───────────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node --version | cut -d. -f1)" != "v20" ]]; then
  echo "==> [bootstrap] Installing Node 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "==> [bootstrap] Node 20 already present: $(node --version)"
fi

# ── Docker Engine ──────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "==> [bootstrap] Installing Docker Engine"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  usermod -aG docker ubuntu
  systemctl enable --now docker
else
  echo "==> [bootstrap] Docker already present: $(docker --version)"
fi

# ── AWS CLI v2 ─────────────────────────────────────────────────────────────────
if ! command -v aws &>/dev/null; then
  echo "==> [bootstrap] Installing AWS CLI v2"
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
  unzip -q /tmp/awscliv2.zip -d /tmp/awscli-install
  /tmp/awscli-install/aws/install
  rm -rf /tmp/awscliv2.zip /tmp/awscli-install
else
  echo "==> [bootstrap] AWS CLI already present: $(aws --version)"
fi

# ── nginx ──────────────────────────────────────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  echo "==> [bootstrap] Installing nginx"
  apt-get install -y nginx
  systemctl enable nginx
else
  echo "==> [bootstrap] nginx already present"
fi

# ── App directory ──────────────────────────────────────────────────────────────
mkdir -p /opt/ruby
chown ubuntu:ubuntu /opt/ruby

echo ""
echo "==> [bootstrap] Done. Next steps:"
echo "    1. git clone <repo> /opt/ruby/app"
echo "    2. bash /opt/ruby/app/deploy/render-env.sh"
echo "    3. bash /opt/ruby/app/deploy/deploy.sh"
echo "    4. Install systemd unit: cp deploy/ruby.service /etc/systemd/system/"
echo "    5. Install nginx site:   cp deploy/nginx.conf /etc/nginx/sites-available/ruby"
echo "       ln -sf /etc/nginx/sites-available/ruby /etc/nginx/sites-enabled/ruby"
echo "       rm -f /etc/nginx/sites-enabled/default"
echo "       nginx -t && systemctl reload nginx"
echo "    6. systemctl daemon-reload && systemctl enable --now ruby"
