import { pool } from '../config/database';

export async function isProcessed(key: string) {
  const res = await pool.query('SELECT processed FROM idempotency_keys WHERE key = $1', [key]);
  if (res.rows.length === 0) return false;
  return res.rows[0].processed === true;
}

export async function markProcessed(key: string) {
  await pool.query(`INSERT INTO idempotency_keys (key, processed) VALUES ($1, true)
    ON CONFLICT (key) DO UPDATE SET processed = excluded.processed, created_at = idempotency_keys.created_at`, [key]);
}
