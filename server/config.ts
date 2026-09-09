import 'dotenv/config';

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  // Render/Railway inject PORT; API_PORT is for local dev.
  apiPort: toInt(process.env.PORT || process.env.API_PORT, 4000),
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  autoBootstrap: String(process.env.AUTO_BOOTSTRAP || 'true').toLowerCase() === 'true',
  appInstanceSlug: process.env.APP_INSTANCE_SLUG || 'main',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  redisUrl: process.env.REDIS_URL || '',
  redisTls: String(process.env.REDIS_TLS || 'false').toLowerCase() === 'true',
  bootstrapAdminKey: process.env.BOOTSTRAP_ADMIN_KEY || '',
  onlineAdminUsername: process.env.ONLINE_ADMIN_USERNAME || 'admin',
  onlineAdminPassword: process.env.ONLINE_ADMIN_PASSWORD || 'ChangeThis123!',
};

export function getDatabaseConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.SUPABASE_DB_HOST;
  const port = process.env.SUPABASE_DB_PORT || '5432';
  const db = process.env.SUPABASE_DB_NAME || 'postgres';
  const user = process.env.SUPABASE_DB_USER || 'postgres';
  const password = process.env.SUPABASE_DB_PASSWORD;

  if (!host || !password) {
    throw new Error('Missing DB connection. Set DATABASE_URL or SUPABASE_DB_HOST + SUPABASE_DB_PASSWORD.');
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}?sslmode=require`;
}
