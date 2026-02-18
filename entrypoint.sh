#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "--- Starting TrackTest Entrypoint ---"

# 0. Generate Prisma Client (Ensure it matches current schema/OS)
echo "[Entrypoint] Generating Prisma Client..."
npx prisma generate

# 1. Sync Database Schema
echo "[Entrypoint] Syncing Database Schema..."
npx prisma db push --accept-data-loss

# 2. Run Seed Script (Ensures default tenant/scenarios exist)
echo "[Entrypoint] Running Database Seeding..."
node seed-tenant.js

# 3. Start the Application
# 3. Start the Application
echo "[Entrypoint] Starting Application with command: $@"
# Verify if next binary exists
if [ -f "./node_modules/.bin/next" ]; then
    echo "[Entrypoint] 'next' binary found."
else
    echo "[Entrypoint] WARNING: 'next' binary NOT found in ./node_modules/.bin/"
    ls -la ./node_modules/.bin/
fi

# Execute command but catch failure
"$@" || {
    echo "[Entrypoint] Error: Application exited with status $?"
    echo "[Entrypoint] Sleeping for 60s to allow inspection..."
    sleep 60
    exit 1
}
