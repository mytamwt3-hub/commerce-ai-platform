import express, { Router } from 'express';
import { pool } from '../config/database';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Create Invoice
router.post('/invoices', verifyToken, async (req: any, res) => {
  try {
    const { vendorName, invoiceNumber, phone, taxNumber, vendorEmail, items, totalAmount, discount, tax, paymentMethod } = req.body;

    const finalAmount = totalAmount - discount + tax;

    const invoice = await pool.query(
      `INSERT INTO invoices (merchant_id, vendor_name, invoice_number, phone, tax_number, vendor_email, items, total_amount, discount, tax, final_amount, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [req.user.id, vendorName, invoiceNumber, phone, taxNumber, vendorEmail, JSON.stringify(items), totalAmount, discount, tax, finalAmount, paymentMethod]
    );

    res.status(201).json(invoice.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Invoices
router.get('/invoices', verifyToken, async (req: any, res) => {
  try {
    const invoices = await pool.query('SELECT * FROM invoices WHERE merchant_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(invoices.rows);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Invoice Details
router.get('/invoices/:invoiceId', verifyToken, async (req: any, res) => {
  try {
    const invoice = await pool.query('SELECT * FROM invoices WHERE id = $1 AND merchant_id = $2', [req.params.invoiceId, req.user.id]);
    if (invoice.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Vendors
router.get('/vendors', verifyToken, async (req: any, res) => {
  try {
    const vendors = await pool.query('SELECT * FROM vendors WHERE merchant_id = $1', [req.user.id]);
    res.json(vendors.rows);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Sales Report
router.get('/sales-report', verifyToken, async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await pool.query(
      `SELECT 
        COUNT(*) as total_sales,
        SUM(final_amount) as total_amount,
        AVG(final_amount) as average_amount
       FROM orders WHERE merchant_id = $1 AND created_at BETWEEN $2 AND $3`,
      [req.user.id, startDate, endDate]
    );
    res.json(report.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Log Expense
router.post('/expenses', verifyToken, async (req: any, res) => {
  try {
    const { amount, category, description } = req.body;
    const expense = await pool.query(
      'INSERT INTO expenses (merchant_id, amount, category, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, amount, category, description]
    );
    res.status(201).json(expense.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

export default router;
