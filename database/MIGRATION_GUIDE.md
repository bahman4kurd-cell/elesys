# PostgreSQL Migration Guide

This guide maps your current local app data to PostgreSQL for online deployment.

## 1) Recommended stack

- Database: PostgreSQL (Supabase, Neon, RDS, or self-hosted)
- API: Node.js with NestJS or Express
- ORM: Prisma or Drizzle
- Cache: Redis (optional but recommended for heavy dashboard traffic)

## Chosen profile for this project

- Database: PostgreSQL (Supabase managed)
- Cache: Redis
- Operational guide: database/SUPABASE_REDIS_RUNBOOK.md

## 2) Apply schema

Run the SQL file:

- File: database/postgres_schema.sql

## 3) Data mapping from current app model

- app.settings -> app_settings
- app.rounds[] -> election_rounds
- round.branches[] -> election_branches
- branch.subTabs[] -> election_subtabs
- subTab.partyVotes[] -> subtab_party_votes
- default + custom parties -> parties
- activeRoundId and selected state -> ui_state

## 4) Migration sequence

1. Create one app_instances row.
2. Insert app_settings.
3. Insert parties first (default + custom).
4. Insert election_rounds.
5. Insert election_branches.
6. Insert election_subtabs.
7. Insert subtab_party_votes by joining on external ids.
8. Insert ui_state.

## 5) Notes for your current codebase

- Keep external ids from current app (round-..., branch-..., subtab-..., party ids like pdk/ynk).
- Do not store plain passwords. Use bcrypt hash in app_users.password_hash.
- Exclude legacy synthetic records (already handled in app logic).

## 6) Query performance checklist

- Keep indexes from schema.
- Add Redis caching for dashboard endpoints.
- Use pagination for long lists.
- Use read replicas if traffic grows.

## 7) Minimal online API endpoints

- POST /auth/login
- GET /settings
- PATCH /settings
- GET /rounds
- POST /rounds
- PATCH /rounds/:id
- DELETE /rounds/:id
- GET /rounds/:roundId/branches
- POST /rounds/:roundId/branches
- GET /branches/:branchId/subtabs
- POST /branches/:branchId/subtabs
- PATCH /subtabs/:subtabId
- POST /subtabs/:subtabId/votes
- GET /dashboard/summary

## 8) Suggested next step

If you want, I can generate:

- Prisma schema file from this SQL
- Type-safe API contracts for your React app
- A one-time migration script that imports current localStorage JSON into PostgreSQL
