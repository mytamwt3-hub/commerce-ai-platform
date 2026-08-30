import express, { Router } from 'express';
import { pool } from '../config/database';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Get User Profile
router.get('/profile', verifyToken, async (req: any, res) => {
  try {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    res.json(user.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Update User Profile
router.put('/profile', verifyToken, async (req: any, res) => {
  try {
    const { fullName, phone, avatar } = req.body;
    const user = await pool.query(
      'UPDATE users SET full_name = $1, phone = $2, avatar = $3 WHERE id = $4 RETURNING *',
      [fullName, phone, avatar, req.user.id]
    );
    res.json(user.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Create Merchant Profile
router.post('/merchant-profile', verifyToken, async (req: any, res) => {
  try {
    const { companyName, taxNumber, companyEmail, companyPhone, address, accountingType, subscription } = req.body;
    const profile = await pool.query(
      'INSERT INTO merchant_profiles (user_id, company_name, tax_number, company_email, company_phone, address, accounting_type, subscription) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, companyName, taxNumber, companyEmail, companyPhone, address, accountingType, subscription]
    );
    res.status(201).json(profile.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Merchant Profile
router.get('/merchant-profile', verifyToken, async (req: any, res) => {
  try {
    const profile = await pool.query('SELECT * FROM merchant_profiles WHERE user_id = $1', [req.user.id]);
    if (profile.rows.length === 0) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }
    res.json(profile.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Create Investor Profile
router.post('/investor-profile', verifyToken, async (req: any, res) => {
  try {
    const profile = await pool.query(
      'INSERT INTO investor_profiles (user_id, wallet_balance, total_invested, total_earnings) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, 0, 0, 0]
    );
    res.status(201).json(profile.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Investor Profile
router.get('/investor-profile', verifyToken, async (req: any, res) => {
  try {
    const profile = await pool.query('SELECT * FROM investor_profiles WHERE user_id = $1', [req.user.id]);
    if (profile.rows.length === 0) {
      return res.status(404).json({ error: 'Investor profile not found' });
    }
    res.json(profile.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

export default router;
