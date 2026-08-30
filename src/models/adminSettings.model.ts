import { pool } from '../config/database';

export async function getSetting(key: string) {
  const res = await pool.query('SELECT value FROM admin_settings WHERE key = $1', [key]);
  if (res.rows.length === 0) return null;
  return res.rows[0].value;
}

export async function setSetting(key: string, value: any) {
  const res = await pool.query('INSERT INTO admin_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now() RETURNING *', [key, value]);
  return res.rows[0];
}

export async function getBoolean(key: string, field = 'enabled') {
  const v = await getSetting(key);
  if (!v) return false;
  return Boolean(v[field]);
}
