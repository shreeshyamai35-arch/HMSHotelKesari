#!/bin/sh
# ─────────────────────────────────────────────────────────────
# Backend container entrypoint.
# 1. Waits for the database and syncs the schema (prisma db push).
# 2. Optionally seeds demo data on first boot (SEED_ON_START=true).
# 3. Starts the API.
# ─────────────────────────────────────────────────────────────
set -e

echo "[entrypoint] Syncing database schema..."
ATTEMPTS=0
until npx prisma db push --skip-generate --accept-data-loss; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 20 ]; then
    echo "[entrypoint] Database not reachable after $ATTEMPTS attempts, giving up."
    exit 1
  fi
  echo "[entrypoint] Database not ready (attempt $ATTEMPTS), retrying in 3s..."
  sleep 3
done

if [ "$SEED_ON_START" = "true" ]; then
  echo "[entrypoint] Seeding demo data (SEED_ON_START=true)..."
  npx tsx prisma/seed.ts || echo "[entrypoint] Seed step reported an error (continuing)."
fi

echo "[entrypoint] Starting API..."
exec node dist/index.js
