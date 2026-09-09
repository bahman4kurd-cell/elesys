# Supabase + Redis Runbook

This is the practical rollout guide for your selected stack:

- PostgreSQL (Managed by Supabase)
- Redis cache

## 1) Create services

1. Create a Supabase project.
2. Create a Redis instance (Upstash, Redis Cloud, or self-hosted).
3. Copy credentials into the env variables in .env.example.

## 2) Apply database schema

1. Open Supabase SQL editor.
2. Run database/postgres_schema.sql.
3. Verify tables were created.

## 3) Seed initial app instance

Run this SQL once in Supabase:

```sql
INSERT INTO app_instances (slug, display_name)
VALUES ('main', 'Election Main Instance')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO app_settings (instance_id, app_name, theme, language)
SELECT id, 'سیستەمی شیکاری ئەنجامەکانی هەڵبژاردن', 'government', 'ckb'
FROM app_instances
WHERE slug = 'main'
ON CONFLICT (instance_id) DO NOTHING;
```

## 4) Security baseline

1. Keep SUPABASE_SERVICE_ROLE_KEY only on backend.
2. Never expose DB password in frontend.
3. Use hashed passwords (bcrypt) in app_users.password_hash.
4. Add rate-limiting on login and write endpoints.
5. Add audit logs for destructive actions.

## 5) Redis caching strategy

Use Redis only for read-heavy endpoints:

- GET /dashboard/summary
- GET /dashboard/party-comparison
- GET /rounds/:id/branches

Suggested key pattern:

- dashboard:summary:{instanceId}:{roundFilter}:{branchFilter}:{subtabFilter}:{partyFilter}:{metricMode}

Suggested cache TTL:

- 30s to 120s for dashboard summaries
- 5m for static lookup lists

Invalidate cache on writes:

- round create/edit/delete
- branch create/edit/delete
- subtab create/edit/delete
- vote updates

## 6) Suggested backend packages

- pg or postgres client
- ioredis
- bcrypt
- jsonwebtoken
- zod

## 7) Minimal go-live checklist

1. SSL enabled for API and DB connections.
2. Daily backup enabled in Supabase.
3. Monitoring for slow queries and error rate.
4. Connection pooling enabled.
5. Separate staging and production environments.

## 8) Next coding step

Generate a backend skeleton with:

- Supabase/Postgres repository layer
- Redis cache middleware
- Dashboard summary endpoint with cache-aside
- Auth endpoint with bcrypt + JWT
