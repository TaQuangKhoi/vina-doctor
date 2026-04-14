
#!/usr/bin/env bash
set -euo pipefail

# Deployment helper — expects a `docker-compose.yml` at $DEPLOY_DIR.
# Use the repository's `docker-compose.yml` to run the full system:
#   Dev:  `docker compose up --build`
#   Prod: `docker compose pull && docker compose up -d`
# This script performs a pull/build + start and a simple health check.

DEPLOY_DIR="/opt/vina-doctor"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.yml"

cd "$DEPLOY_DIR"

echo "==> Pulling latest images..."
docker compose pull || true

echo "==> Building & starting services..."
docker compose up -d --build --remove-orphans

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Health check..."
sleep 5
for svc in ai_engine backend frontend; do
  status=$(docker inspect --format='{{.State.Status}}' "$(docker compose ps -q "$svc")" 2>/dev/null || echo "missing")
  echo "  $svc: $status"
done

echo "==> Deploy complete!"
docker compose ps
