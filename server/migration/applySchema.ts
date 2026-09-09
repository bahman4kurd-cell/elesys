import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import { getDatabaseConnectionString } from '../config';

async function run(): Promise<void> {
  const schemaPath = path.resolve(process.cwd(), 'database', 'postgres_schema.sql');
  const sql = await readFile(schemaPath, 'utf8');

  const pool = new Pool({ connectionString: getDatabaseConnectionString() });
  const client = await pool.connect();

  try {
    await client.query(sql);
    console.log('Schema applied successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error('Failed to apply schema:', error);
  process.exit(1);
});
