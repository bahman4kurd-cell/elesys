import 'dotenv/config';
import { Pool } from 'pg';
import { config, getDatabaseConnectionString } from '../config';
import { hashPassword } from '../auth';

async function run(): Promise<void> {
  const pool = new Pool({ connectionString: getDatabaseConnectionString() });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const instanceRes = await client.query<{ id: string }>(
      `
      INSERT INTO app_instances (slug, display_name)
      VALUES ($1, $2)
      ON CONFLICT (slug)
      DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id
      `,
      [config.appInstanceSlug, 'Election Main Instance']
    );

    const instanceId = instanceRes.rows[0].id;

    await client.query(
      `
      INSERT INTO app_settings (instance_id, app_name, theme, language)
      VALUES ($1, $2, 'government', 'ckb')
      ON CONFLICT (instance_id)
      DO UPDATE SET app_name = EXCLUDED.app_name, theme = EXCLUDED.theme, language = EXCLUDED.language
      `,
      [instanceId, 'سیستەمی شیکاری ئەنجامەکانی هەڵبژاردن']
    );

    const passwordHash = await hashPassword(config.onlineAdminPassword);

    // زیادکردنی یوزەری ئەمین (Admin)
    await client.query(
      `
      INSERT INTO app_users (instance_id, username, password_hash, role, is_active)
      VALUES ($1, $2, $3, 'admin', TRUE)
      ON CONFLICT (instance_id, username)
      DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE
      `,
      [instanceId, config.onlineAdminUsername, passwordHash]
    );

    // زیادکردنی یوزەری تەنها بینەر (Viewer) بۆ بینینی داتاکان بەبێ دەسەڵاتی دەستکاری
    const viewerPasswordHash = await hashPassword('viewer123'); // دەتوانیت پاسوۆردەکەی لێرە بگۆڕیت
    await client.query(
      `
      INSERT INTO app_users (instance_id, username, password_hash, role, is_active)
      VALUES ($1, $2, $3, 'viewer', TRUE)
      ON CONFLICT (instance_id, username)
      DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE
      `,
      [instanceId, 'viewer', viewerPasswordHash]
    );

    await client.query(
      `
      INSERT INTO ui_state (instance_id, active_round_external_id)
      VALUES ($1, 'dashboard')
      ON CONFLICT (instance_id) DO NOTHING
      `,
      [instanceId]
    );

    await client.query('COMMIT');

    console.log('Online setup completed. - setupOnline.ts:72');
    console.log(`Instance slug: ${config.appInstanceSlug} - setupOnline.ts:73`);
    console.log(`Admin username: ${config.onlineAdminUsername} - setupOnline.ts:74`);
    console.log(`Viewer username: viewer (Password: viewer123) - setupOnline.ts:75`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error('Online setup failed: - setupOnline.ts:86', error);
  process.exit(1);
});