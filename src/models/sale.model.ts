import { pool } from '../config/database';

export async function createSale(payload: any) {
  const { orderId, requestId, productId, quantity, unitPrice } = payload;
  const res = await pool.query('INSERT INTO sales (order_id, request_id, product_id, quantity, unit_price, payload) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [orderId, requestId || null, productId || null, quantity || null, unitPrice || null, payload]);
  return res.rows[0];
}

export async function getSaleByOrder(orderId: string) {
  const res = await pool.query('SELECT * FROM sales WHERE order_id = $1', [orderId]);
  return res.rows[0];
}

export async function markSaleDistributed(orderId: string) {
  const res = await pool.query('UPDATE sales SET status = $1, distributed_at = now() WHERE order_id = $2 RETURNING *', ['distributed', orderId]);
  return res.rows[0];
}

export async function markSalePendingAdmin(orderId: string) {
  const res = await pool.query("UPDATE sales SET status = $1 WHERE order_id = $2 RETURNING *", ['pending_admin', orderId]);
  return res.rows[0];
}
