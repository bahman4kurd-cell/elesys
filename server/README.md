# API Skeleton (Supabase + Redis)

## One-click Windows setup

You can run everything from the project root with:

- setup-online.bat

This performs:

1. npm install
2. npm run db:apply-schema
3. npm run setup:online
4. npm run api:dev

To run API + frontend together after setup:

- run-online-dev.bat

## Run API locally

1. Fill environment values in .env
2. Install packages
3. Run:

npm run api:dev

Apply schema manually:

npm run db:apply-schema

Bootstrap instance and admin user:

npm run setup:online

Import old JSON data to PostgreSQL:

npm run migrate:json -- path/to/export.json --slug=main --replace=true

## Endpoints

- GET /api/health
- POST /api/auth/login
- POST /api/auth/bootstrap-admin
- GET /api/dashboard/summary (Bearer token required)
- GET /api/state (Bearer token required)
- PUT /api/state (Bearer token required)

## Example login body

{
  "slug": "main",
  "username": "admin",
  "password": "ChangeThis123!"
}

## Example dashboard call

Authorization: Bearer <token>

GET /api/dashboard/summary?roundExternalId=all

## Example state sync calls

Authorization: Bearer <token>

GET /api/state

PUT /api/state
{
  "db": { "version": 1, "lastUpdated": "2026-01-01T00:00:00.000Z", "rounds": [], "activeRoundId": "dashboard", "customParties": [], "settings": { "useKurdishNumerals": true, "autoSaveIntervalMs": 30000, "appName": "..." } }
}

## Notes

- bootstrap-admin is protected with BOOTSTRAP_ADMIN_KEY.
- Keep SUPABASE_SERVICE_ROLE_KEY and DB credentials only on backend.
- Redis is optional; if REDIS_URL is empty, API still works without cache.
