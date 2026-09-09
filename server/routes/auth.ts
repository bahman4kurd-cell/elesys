import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { config } from '../config';
import { hashPassword, signToken, verifyPassword } from '../auth';

export const authRouter = Router();

const loginSchema = z.object({
  slug: z.string().min(1).optional(),
  username: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
      return;
    }

    const { slug = config.appInstanceSlug, username, password } = parsed.data;

    const userResult = await query<{
      user_id: string;
      instance_id: string;
      role: string;
      username: string;
      password_hash: string;
    }>(
      `
      SELECT
        u.id AS user_id,
        u.instance_id,
        u.role,
        u.username,
        u.password_hash
      FROM app_users u
      JOIN app_instances i ON i.id = u.instance_id
      WHERE i.slug = $1 AND u.username = $2 AND u.is_active = TRUE
      LIMIT 1
      `,
      [slug, username]
    );

    const user = userResult.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    await query('UPDATE app_users SET last_login_at = now() WHERE id = $1', [user.user_id]);

    const token = signToken({
      userId: user.user_id,
      instanceId: user.instance_id,
      username: user.username,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role,
        instanceId: user.instance_id,
      },
    });
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const bootstrapSchema = z.object({
  bootstrapKey: z.string().min(1),
  slug: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
  displayName: z.string().min(1).optional(),
});

authRouter.post('/bootstrap-admin', async (req, res) => {
  try {
    const parsed = bootstrapSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
      return;
    }

    const { bootstrapKey, slug = config.appInstanceSlug } = parsed.data;
    if (!config.bootstrapAdminKey || bootstrapKey !== config.bootstrapAdminKey) {
      res.status(403).json({ error: 'Invalid bootstrap key' });
      return;
    }

    const username = parsed.data.username || config.onlineAdminUsername;
    const password = parsed.data.password || config.onlineAdminPassword;
    const displayName = parsed.data.displayName || 'Election Main Instance';

    const instanceResult = await query<{ id: string }>(
      `
      INSERT INTO app_instances (slug, display_name)
      VALUES ($1, $2)
      ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id
      `,
      [slug, displayName]
    );

    const instanceId = instanceResult.rows[0].id;

    await query(
      `
      INSERT INTO app_settings (instance_id, app_name, theme, language)
      VALUES ($1, $2, 'government', 'ckb')
      ON CONFLICT (instance_id) DO NOTHING
      `,
      [instanceId, 'سیستەمی شیکاری ئەنجامەکانی هەڵبژاردن']
    );

    const hash = await hashPassword(password);

    const userResult = await query<{ id: string }>(
      `
      INSERT INTO app_users (instance_id, username, password_hash, role)
      VALUES ($1, $2, $3, 'admin')
      ON CONFLICT (instance_id, username)
      DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE
      RETURNING id
      `,
      [instanceId, username, hash]
    );

    res.json({ ok: true, instanceId, userId: userResult.rows[0].id, username });
  } catch (error) {
    console.error('Bootstrap route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
