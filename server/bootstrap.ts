import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from './db';
import { config } from './config';
import { hashPassword } from './auth';

// Idempotent: safe to run on every server start (CREATE IF NOT EXISTS + ON CONFLICT).
export async function bootstrapDatabase(): Promise<void> {
  const schemaPath = path.resolve(process.cwd(), 'database', 'postgres_schema.sql');
  const sql = await readFile(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query(sql);

    await client.query('BEGIN');

    const instanceRes = await client.query<{ id: string }>(
      `
      INSERT INTO app_instances (slug, display_name)
      VALUES ($1, $2)
      ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id
      `,
      [config.appInstanceSlug, 'Election Main Instance']
    );
    const instanceId = instanceRes.rows[0].id;

    await client.query(
      `
      INSERT INTO app_settings (instance_id, app_name, theme, language)
      VALUES ($1, $2, 'government', 'ckb')
      ON CONFLICT (instance_id) DO NOTHING
      `,
      [instanceId, 'سیستەمی شیکاری ئەنجامەکانی هەڵبژاردن']
    );

    // Only create the admin if missing so a later password change in the app is not overwritten.
    const existing = await client.query<{ id: string }>(
      'SELECT id FROM app_users WHERE instance_id = $1 AND username = $2 LIMIT 1',
      [instanceId, config.onlineAdminUsername]
    );
    if (existing.rows.length === 0) {
      const passwordHash = await hashPassword(config.onlineAdminPassword);
      await client.query(
        `
        INSERT INTO app_users (instance_id, username, password_hash, role, is_active)
        VALUES ($1, $2, $3, 'admin', TRUE)
        `,
        [instanceId, config.onlineAdminUsername, passwordHash]
      );
    }

    await client.query(
      `
      INSERT INTO ui_state (instance_id, active_round_external_id)
      VALUES ($1, 'dashboard')
      ON CONFLICT (instance_id) DO NOTHING
      `,
      [instanceId]
    );

    await client.query('COMMIT');
    console.log(`Database ready. Instance "${config.appInstanceSlug}", admin "${config.onlineAdminUsername}".`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
