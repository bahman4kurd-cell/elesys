import { Pool, PoolClient, QueryResult } from 'pg';
import { getDatabaseConnectionString } from './config';

const pool = new Pool({
  connectionString: getDatabaseConnectionString(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
  return pool.query<T>(sql, params);
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDb(): Promise<void> {
  await pool.end();
}

export { pool };
