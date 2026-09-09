import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Pool, PoolClient } from 'pg';
import { z } from 'zod';
import { getDatabaseConnectionString, config } from '../config';
import { hashPassword } from '../auth';
import { DEFAULT_PARTIES } from '../../src/data/defaultParties';

const partyVoteSchema = z.object({
  partyId: z.string(),
  partyName: z.string(),
  votes: z.number().int().nonnegative(),
  color: z.string().default('#94A3B8'),
  textColor: z.string().optional(),
});

const subTabSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalCastVotes: z.number().int().nonnegative().default(0),
  burnedVotes: z.number().int().nonnegative().default(0),
  validVotes: z.number().int().nonnegative().default(0),
  autoCalcValidVotes: z.boolean().default(true),
  selectedChartType: z.enum(['pie', 'donut', 'bar', 'line', 'area']).default('bar'),
  notes: z.string().optional(),
  partyVotes: z.array(partyVoteSchema).default([]),
});

const branchSchema = z.object({
  id: z.string(),
  name: z.string(),
  activeSubTabId: z.string().optional().default(''),
  subTabs: z.array(subTabSchema).default([]),
});

const roundSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['kurdistan', 'iraq', 'provincial', 'custom']).default('custom'),
  year: z.number().int(),
  dateStr: z.string().optional(),
  notes: z.string().optional(),
  subTabs: z.array(subTabSchema).optional().default([]),
  activeSubTabId: z.string().optional().default(''),
  branches: z.array(branchSchema).optional().default([]),
});

const customPartySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  textColor: z.string().optional(),
  isCustom: z.boolean().optional().default(true),
});

const dbSchema = z.object({
  rounds: z.array(roundSchema),
  activeRoundId: z.string().default('dashboard'),
  customParties: z.array(customPartySchema).default([]),
  settings: z.object({
    useKurdishNumerals: z.boolean().default(false),
    autoSaveIntervalMs: z.number().int().nonnegative().default(30000),
    appName: z.string().default('سیستەمی شیکاری ئەنجامەکانی هەڵبژاردن'),
    theme: z.enum(['dark', 'light', 'gray', 'government']).optional().default('government'),
    language: z.enum(['ckb', 'kmr', 'ar', 'en']).optional().default('ckb'),
  }),
});

interface Args {
  jsonPath: string;
  slug: string;
  replace: boolean;
}

function parseArgs(argv: string[]): Args {
  const jsonPath = argv[2];
  if (!jsonPath) {
    throw new Error('Usage: npm run migrate:json -- <path-to-json> [--slug=main] [--replace=true|false]');
  }

  const slugArg = argv.find((x) => x.startsWith('--slug='));
  const replaceArg = argv.find((x) => x.startsWith('--replace='));

  return {
    jsonPath,
    slug: slugArg ? slugArg.split('=')[1] : config.appInstanceSlug,
    replace: replaceArg ? replaceArg.split('=')[1] !== 'false' : true,
  };
}

async function upsertInstance(client: PoolClient, slug: string): Promise<string> {
  const result = await client.query<{ id: string }>(
    `
    INSERT INTO app_instances (slug, display_name)
    VALUES ($1, $2)
    ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING id
    `,
    [slug, 'Election Main Instance']
  );

  return result.rows[0].id;
}

async function upsertSettings(client: PoolClient, instanceId: string, settings: z.infer<typeof dbSchema>['settings']): Promise<void> {
  await client.query(
    `
    INSERT INTO app_settings (instance_id, use_kurdish_numerals, auto_save_interval_ms, app_name, theme, language)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (instance_id)
    DO UPDATE SET
      use_kurdish_numerals = EXCLUDED.use_kurdish_numerals,
      auto_save_interval_ms = EXCLUDED.auto_save_interval_ms,
      app_name = EXCLUDED.app_name,
      theme = EXCLUDED.theme,
      language = EXCLUDED.language
    `,
    [
      instanceId,
      settings.useKurdishNumerals,
      settings.autoSaveIntervalMs,
      settings.appName,
      settings.theme,
      settings.language,
    ]
  );
}

async function ensureAdminUser(client: PoolClient, instanceId: string): Promise<void> {
  const passwordHash = await hashPassword(config.onlineAdminPassword);
  await client.query(
    `
    INSERT INTO app_users (instance_id, username, password_hash, role, is_active)
    VALUES ($1, $2, $3, 'admin', TRUE)
    ON CONFLICT (instance_id, username)
    DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE
    `,
    [instanceId, config.onlineAdminUsername, passwordHash]
  );
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv);
  const raw = await readFile(args.jsonPath, 'utf8');
  const parsed = dbSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    throw new Error(`Invalid JSON structure: ${JSON.stringify(parsed.error.flatten())}`);
  }

  const data = parsed.data;
  const pool = new Pool({ connectionString: getDatabaseConnectionString() });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const instanceId = await upsertInstance(client, args.slug);
    await upsertSettings(client, instanceId, data.settings);

    if (args.replace) {
      await client.query(
        `
        DELETE FROM election_rounds
        WHERE instance_id = $1
        `,
        [instanceId]
      );

      await client.query(
        `
        DELETE FROM parties
        WHERE instance_id = $1
        `,
        [instanceId]
      );
    }

    const partySeedMap = new Map<string, { id: string; name: string; color: string; textColor?: string; isCustom: boolean }>();

    for (const p of DEFAULT_PARTIES) {
      partySeedMap.set(p.id, {
        id: p.id,
        name: p.name,
        color: p.color,
        textColor: p.textColor,
        isCustom: false,
      });
    }

    for (const p of data.customParties) {
      partySeedMap.set(p.id, {
        id: p.id,
        name: p.name,
        color: p.color,
        textColor: p.textColor,
        isCustom: true,
      });
    }

    for (const round of data.rounds) {
      for (const branch of round.branches || []) {
        for (const subtab of branch.subTabs) {
          for (const pv of subtab.partyVotes) {
            if (!partySeedMap.has(pv.partyId)) {
              partySeedMap.set(pv.partyId, {
                id: pv.partyId,
                name: pv.partyName,
                color: pv.color || '#94A3B8',
                textColor: pv.textColor,
                isCustom: true,
              });
            }
          }
        }
      }
    }

    const partyDbIdByExternal = new Map<string, string>();
    for (const party of partySeedMap.values()) {
      const result = await client.query<{ id: string }>(
        `
        INSERT INTO parties (instance_id, external_id, name, color, text_color, is_custom)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (instance_id, external_id)
        DO UPDATE SET
          name = EXCLUDED.name,
          color = EXCLUDED.color,
          text_color = EXCLUDED.text_color,
          is_custom = EXCLUDED.is_custom
        RETURNING id
        `,
        [instanceId, party.id, party.name, party.color, party.textColor || null, party.isCustom]
      );
      partyDbIdByExternal.set(party.id, result.rows[0].id);
    }

    for (let roundIndex = 0; roundIndex < data.rounds.length; roundIndex += 1) {
      const round = data.rounds[roundIndex];

      const roundResult = await client.query<{ id: string }>(
        `
        INSERT INTO election_rounds (instance_id, external_id, title, category, year, date_str, notes, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (instance_id, external_id)
        DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          year = EXCLUDED.year,
          date_str = EXCLUDED.date_str,
          notes = EXCLUDED.notes,
          display_order = EXCLUDED.display_order
        RETURNING id
        `,
        [
          instanceId,
          round.id,
          round.title,
          round.category,
          round.year,
          round.dateStr || null,
          round.notes || null,
          roundIndex,
        ]
      );

      const roundDbId = roundResult.rows[0].id;

      const branches = (round.branches || []).filter(
        (branch) => !['لقی سەرەکی', 'بنچینە'].includes((branch.name || '').trim())
      );

      for (let branchIndex = 0; branchIndex < branches.length; branchIndex += 1) {
        const branch = branches[branchIndex];

        const branchResult = await client.query<{ id: string }>(
          `
          INSERT INTO election_branches (round_id, external_id, name, display_order)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (round_id, external_id)
          DO UPDATE SET
            name = EXCLUDED.name,
            display_order = EXCLUDED.display_order
          RETURNING id
          `,
          [roundDbId, branch.id, branch.name, branchIndex]
        );

        const branchDbId = branchResult.rows[0].id;

        for (let subtabIndex = 0; subtabIndex < branch.subTabs.length; subtabIndex += 1) {
          const subtab = branch.subTabs[subtabIndex];

          const subtabResult = await client.query<{ id: string }>(
            `
            INSERT INTO election_subtabs (
              branch_id,
              external_id,
              name,
              total_cast_votes,
              burned_votes,
              valid_votes,
              auto_calc_valid_votes,
              selected_chart_type,
              notes,
              display_order
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (branch_id, external_id)
            DO UPDATE SET
              name = EXCLUDED.name,
              total_cast_votes = EXCLUDED.total_cast_votes,
              burned_votes = EXCLUDED.burned_votes,
              valid_votes = EXCLUDED.valid_votes,
              auto_calc_valid_votes = EXCLUDED.auto_calc_valid_votes,
              selected_chart_type = EXCLUDED.selected_chart_type,
              notes = EXCLUDED.notes,
              display_order = EXCLUDED.display_order
            RETURNING id
            `,
            [
              branchDbId,
              subtab.id,
              subtab.name,
              subtab.totalCastVotes,
              subtab.burnedVotes,
              subtab.validVotes,
              subtab.autoCalcValidVotes,
              subtab.selectedChartType,
              subtab.notes || null,
              subtabIndex,
            ]
          );

          const subtabDbId = subtabResult.rows[0].id;

          for (const pv of subtab.partyVotes) {
            const partyDbId = partyDbIdByExternal.get(pv.partyId);
            if (!partyDbId) continue;

            await client.query(
              `
              INSERT INTO subtab_party_votes (subtab_id, party_id, votes)
              VALUES ($1, $2, $3)
              ON CONFLICT (subtab_id, party_id)
              DO UPDATE SET votes = EXCLUDED.votes
              `,
              [subtabDbId, partyDbId, pv.votes]
            );
          }
        }
      }
    }

    await client.query(
      `
      INSERT INTO ui_state (instance_id, active_round_external_id)
      VALUES ($1, $2)
      ON CONFLICT (instance_id)
      DO UPDATE SET active_round_external_id = EXCLUDED.active_round_external_id
      `,
      [instanceId, data.activeRoundId || 'dashboard']
    );

    await client.query(
      `
      INSERT INTO app_state_snapshots (instance_id, db_data, last_updated)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (instance_id)
      DO UPDATE SET db_data = EXCLUDED.db_data, last_updated = now()
      `,
      [instanceId, JSON.stringify(data)]
    );

    await ensureAdminUser(client, instanceId);

    await client.query('COMMIT');

    console.log('Migration completed successfully.');
    console.log(`Instance slug: ${args.slug}`);
    console.log(`Rounds imported: ${data.rounds.length}`);
    console.log(`Parties imported: ${partySeedMap.size}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
