#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "--- Starting PromptVS Entrypoint ---"

# 1. Run Prisma Migrations
echo "[Entrypoint] Running Prisma Migrations..."
npx prisma@6 migrate deploy

# 2. Run Seed Script (Ensures default tenant/scenarios exist)
echo "[Entrypoint] Running Database Seeding..."
node seed-tenant.js

# 3. Start the Application
echo "[Entrypoint] Starting Application..."
exec "$@"
