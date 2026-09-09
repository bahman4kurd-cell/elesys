import { Router } from 'express';
import { z } from 'zod';
import { cacheGet, cacheSetEx } from '../cache';
import { query } from '../db';

export const dashboardRouter = Router();

const summaryQuerySchema = z.object({
  roundExternalId: z.string().optional(),
  branchExternalId: z.string().optional(),
  subtabExternalId: z.string().optional(),
  partyExternalId: z.string().optional(),
});

dashboardRouter.get('/summary', async (req, res) => {
  try {
    const parsed = summaryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query params', details: parsed.error.flatten() });
      return;
    }

    const auth = req.auth;
    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const filters = parsed.data;
    const cacheKey = [
      'dashboard:summary',
      auth.instanceId,
      filters.roundExternalId || 'all',
      filters.branchExternalId || 'all',
      filters.subtabExternalId || 'all',
      filters.partyExternalId || 'all',
    ].join(':');

    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const params: unknown[] = [auth.instanceId];
    const where: string[] = ['v.instance_id = $1'];

    if (filters.roundExternalId) {
      params.push(filters.roundExternalId);
      where.push(`v.round_external_id = $${params.length}`);
    }

    if (filters.branchExternalId) {
      params.push(filters.branchExternalId);
      where.push(`v.branch_external_id = $${params.length}`);
    }

    if (filters.subtabExternalId) {
      params.push(filters.subtabExternalId);
      where.push(`v.subtab_external_id = $${params.length}`);
    }

    if (filters.partyExternalId) {
      params.push(filters.partyExternalId);
      where.push(`v.party_external_id = $${params.length}`);
    }

    const whereSql = where.join(' AND ');

    const totalsResult = await query<{
      total_votes: string;
      total_valid_votes: string;
      rounds_count: string;
      branches_count: string;
      subtabs_count: string;
    }>(
      `
      SELECT
        COALESCE(SUM(v.votes), 0) AS total_votes,
        COALESCE(SUM(v.valid_votes), 0) AS total_valid_votes,
        COUNT(DISTINCT v.round_id) AS rounds_count,
        COUNT(DISTINCT v.branch_id) AS branches_count,
        COUNT(DISTINCT v.subtab_id) AS subtabs_count
      FROM v_dashboard_party_summary v
      WHERE ${whereSql}
      `,
      params
    );

    const partiesResult = await query<{
      party_external_id: string;
      party_name: string;
      party_color: string;
      votes: string;
      valid_votes: string;
      percentage: string;
    }>(
      `
      SELECT
        v.party_external_id,
        v.party_name,
        v.party_color,
        SUM(v.votes)::BIGINT AS votes,
        SUM(v.valid_votes)::BIGINT AS valid_votes,
        CASE WHEN SUM(v.valid_votes) > 0
          THEN ROUND((SUM(v.votes)::NUMERIC / SUM(v.valid_votes)::NUMERIC) * 100, 2)
          ELSE 0
        END AS percentage
      FROM v_dashboard_party_summary v
      WHERE ${whereSql}
      GROUP BY v.party_external_id, v.party_name, v.party_color
      ORDER BY SUM(v.votes) DESC
      `,
      params
    );

    const totals = totalsResult.rows[0] || {
      total_votes: '0',
      total_valid_votes: '0',
      rounds_count: '0',
      branches_count: '0',
      subtabs_count: '0',
    };

    const response = {
      totals: {
        totalVotes: Number(totals.total_votes || 0),
        totalValidVotes: Number(totals.total_valid_votes || 0),
        roundsCount: Number(totals.rounds_count || 0),
        branchesCount: Number(totals.branches_count || 0),
        subtabsCount: Number(totals.subtabs_count || 0),
      },
      parties: partiesResult.rows.map((p) => ({
        partyId: p.party_external_id,
        name: p.party_name,
        color: p.party_color,
        votes: Number(p.votes || 0),
        validVotes: Number(p.valid_votes || 0),
        percentage: Number(p.percentage || 0),
      })),
    };

    await cacheSetEx(cacheKey, 60, JSON.stringify(response));
    res.json(response);
  } catch (error) {
    console.error('Dashboard summary route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
