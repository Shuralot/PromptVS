#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "--- Starting TrackTest Entrypoint ---"

# 1. Sync Database Schema
echo "[Entrypoint] Syncing Database Schema..."
npx prisma db push --accept-data-loss

# 2. Run Seed Script (Ensures default tenant/scenarios exist)
echo "[Entrypoint] Running Database Seeding..."
node seed-tenant.js

# 3. Start the Application
echo "[Entrypoint] Starting Application..."
exec "$@"
