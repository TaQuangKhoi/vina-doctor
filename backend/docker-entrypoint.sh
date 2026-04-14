#!/bin/sh
set -e

# Work from the backend source directory
cd /app/backend || exit 1

# Run Alembic migrations with retries (DATABASE_URL is read from env)
RETRIES=${DB_MIGRATE_RETRIES:-10}
SLEEP=${DB_MIGRATE_WAIT:-3}
i=0
until [ "$i" -ge "$RETRIES" ]; do
  if alembic -c alembic.ini upgrade head; then
    echo "Alembic migrations applied."
    break
  fi
  i=$((i+1))
  echo "Alembic attempt $i/$RETRIES failed; retrying in $SLEEP seconds..."
  sleep "$SLEEP"
done

if [ "$i" -ge "$RETRIES" ]; then
  echo "ERROR: Alembic migrations failed after $RETRIES attempts."
  exit 1
fi

# Exec the CMD (uvicorn) as PID 1
exec "$@"
