import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';

export const stateRouter = Router();

stateRouter.get('/', async (req, res) => {
  try {
    const auth = req.auth;
    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await query<{ db_data: unknown; last_updated: string }>(
      `
      SELECT db_data, last_updated
      FROM app_state_snapshots
      WHERE instance_id = $1
      LIMIT 1
      `,
      [auth.instanceId]
    );

    if (result.rows.length === 0) {
      res.json({ db: null, lastUpdated: null });
      return;
    }

    const row = result.rows[0];
    res.json({ db: row.db_data, lastUpdated: row.last_updated });
  } catch (error) {
    console.error('State GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const putStateSchema = z.object({
  db: z.record(z.any()),
});

stateRouter.put('/', async (req, res) => {
  try {
    const auth = req.auth;
    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parsed = putStateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      return;
    }

    await query(
      `
      INSERT INTO app_state_snapshots (instance_id, db_data, last_updated)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (instance_id)
      DO UPDATE SET db_data = EXCLUDED.db_data, last_updated = now()
      `,
      [auth.instanceId, JSON.stringify(parsed.data.db)]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('State PUT error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
