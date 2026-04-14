#!/usr/bin/env bash
set -euo pipefail

cd /opt/vina-doctor

if [ -n "${SERVEO_PRIVATE_KEY:-}" ] && [ -n "${SERVEO_DOMAIN:-}" ]; then
  echo "Installing Serveo private key and creating autossh systemd unit..."
  mkdir -p /root/.ssh
  umask 077
  printf '%s\n' "$SERVEO_PRIVATE_KEY" > /root/.ssh/serveo_vina
  chmod 600 /root/.ssh/serveo_vina

  if command -v apt-get >/dev/null 2>&1; then apt-get update && apt-get install -y autossh || true
  elif command -v yum >/dev/null 2>&1; then yum install -y autossh || true
  elif command -v apk >/dev/null 2>&1; then apk add --no-cache autossh || true
  fi

  cat > /etc/systemd/system/serveo-autossh.service <<EOF
[Unit]
Description=Autossh Serveo Tunnel
After=network.target docker.service

[Service]
User=root
Environment="AUTOSSH_GATETIME=0"
ExecStart=/usr/bin/autossh -M 0 -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -i /root/.ssh/serveo_vina -N -R ${SERVEO_DOMAIN}:80:localhost:80 serveo.net
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload || true
  systemctl enable serveo-autossh.service || true
fi

COMPOSE_URL="https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${GITHUB_SHA}/docker-compose.yml"
NGINX_URL="https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${GITHUB_SHA}/nginx/nginx.conf"
echo "Fetching $COMPOSE_URL"
if ! curl -fsSL "$COMPOSE_URL" -o docker-compose.yml; then
  echo "ERROR: failed to download docker-compose.yml from $COMPOSE_URL"
  exit 1
fi
mkdir -p nginx
echo "Fetching $NGINX_URL"
if ! curl -fsSL "$NGINX_URL" -o nginx/nginx.conf; then
  echo "ERROR: failed to download nginx/nginx.conf from $NGINX_URL"
  exit 1
fi

if ! docker compose -f docker-compose.yml config >/dev/null; then
  echo "ERROR: docker-compose.yml is invalid — dumping contents for debug:"
  sed -n '1,200p' docker-compose.yml || true
  exit 1
fi

echo "${GITHUB_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

docker compose -f docker-compose.yml up -d --remove-orphans

if [ -n "${SERVEO_PRIVATE_KEY:-}" ] && [ -n "${SERVEO_DOMAIN:-}" ]; then
  systemctl restart serveo-autossh.service || true
  sleep 2
  systemctl status serveo-autossh.service --no-pager || true
fi

docker image prune -f

echo "==> Deploy complete!"
docker compose -f docker-compose.yml ps