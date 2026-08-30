import express, { Router } from 'express';
import { pool } from '../config/database';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Create Investment Project (Merchant)
router.post('/projects', verifyToken, async (req: any, res) => {
  try {
    const { projectName, description, totalCost, items, profitPercentage } = req.body;

    const project = await pool.query(
      `INSERT INTO investments (merchant_id, project_name, description, total_cost, invested_amount, profit_percentage, status, items)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, projectName, description, totalCost, 0, profitPercentage, 'active', JSON.stringify(items)]
    );

    res.status(201).json(project.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get All Investment Projects (For Investors)
router.get('/projects', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let query = 'SELECT * FROM investments WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, (parseInt(page as string) - 1) * parseInt(limit as string));

    const projects = await pool.query(query, params);
    res.json(projects.rows);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Investment Project Details
router.get('/projects/:projectId', async (req, res) => {
  try {
    const project = await pool.query('SELECT * FROM investments WHERE id = $1', [req.params.projectId]);
    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Invest in Project (Investor)
router.post('/projects/:projectId/invest', verifyToken, async (req: any, res) => {
  try {
    const { amount } = req.body;

    // Get investor wallet
    const investor = await pool.query('SELECT wallet_balance FROM investor_profiles WHERE user_id = $1', [req.user.id]);
    if (investor.rows.length === 0) {
      return res.status(404).json({ error: 'Investor profile not found' });
    }

    if (investor.rows[0].wallet_balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get project
    const project = await pool.query('SELECT * FROM investments WHERE id = $1', [req.params.projectId]);
    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate investor share
    const investorSharePercentage = (amount / project.rows[0].total_cost) * 100;
    const expectedReturn = (amount * project.rows[0].profit_percentage) / 100;

    // Create investment record
    const investment = await pool.query(
      `INSERT INTO investor_investments (investor_id, investment_id, amount, investor_share, expected_return, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, req.params.projectId, amount, investorSharePercentage, expectedReturn, 'active']
    );

    // Deduct from wallet
    await pool.query(
      'UPDATE investor_profiles SET wallet_balance = wallet_balance - $1, total_invested = total_invested + $1 WHERE user_id = $2',
      [amount, req.user.id]
    );

    // Update project invested amount
    await pool.query(
      'UPDATE investments SET invested_amount = invested_amount + $1 WHERE id = $2',
      [amount, req.params.projectId]
    );

    res.status(201).json(investment.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Investor Portfolio
router.get('/portfolio', verifyToken, async (req: any, res) => {
  try {
    const portfolio = await pool.query(
      `SELECT ip.*, i.project_name, i.status, m.full_name as merchant_name
       FROM investor_investments ip
       JOIN investments i ON ip.investment_id = i.id
       JOIN users m ON i.merchant_id = m.id
       WHERE ip.investor_id = $1`,
      [req.user.id]
    );

    const profileData = await pool.query('SELECT * FROM investor_profiles WHERE user_id = $1', [req.user.id]);

    res.json({
      profile: profileData.rows[0],
      investments: portfolio.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Log Sale (Merchant)
router.post('/projects/:projectId/sales', verifyToken, async (req: any, res) => {
  try {
    const { saleAmount, soldItems } = req.body;

    // Get project
    const project = await pool.query('SELECT * FROM investments WHERE id = $1', [req.params.projectId]);
    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate profit
    const profit = saleAmount - project.rows[0].total_cost;
    const platformFee = (saleAmount * 0.02); // 2% platform fee

    // Get all investors in this project
    const investors = await pool.query(
      'SELECT * FROM investor_investments WHERE investment_id = $1',
      [req.params.projectId]
    );

    // Distribute profits
    for (const inv of investors.rows) {
      const investorShare = (inv.investor_share / 100) * (profit - platformFee);
      const merchantShare = saleAmount - investorShare - platformFee;

      // Create profit distribution record
      await pool.query(
        `INSERT INTO profit_distributions (investment_id, sale_amount, investor_share, merchant_share, platform_fee)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.params.projectId, saleAmount, investorShare, merchantShare, platformFee]
      );

      // Update investor earnings
      await pool.query(
        'UPDATE investor_profiles SET total_earnings = total_earnings + $1 WHERE user_id = $2',
        [investorShare, inv.investor_id]
      );

      // Add to investor wallet
      await pool.query(
        'UPDATE investor_profiles SET wallet_balance = wallet_balance + $1 WHERE user_id = $2',
        [investorShare, inv.investor_id]
      );
    }

    // Update investment status if completed
    if (soldItems >= 100) { // Assuming 100 items is completion
      await pool.query(
        'UPDATE investments SET status = $1, actual_return = $2 WHERE id = $3',
        ['completed', profit, req.params.projectId]
      );
    }

    res.json({
      message: 'Sale recorded and profits distributed',
      totalProfit: profit,
      platformFee: platformFee,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Investment Opportunities
router.get('/opportunities', async (req, res) => {
  try {
    const opportunities = await pool.query(
      `SELECT i.*, u.full_name as merchant_name, m.company_name
       FROM investments i
       JOIN users u ON i.merchant_id = u.id
       LEFT JOIN merchant_profiles m ON u.id = m.user_id
       WHERE i.status = 'active'
       ORDER BY i.created_at DESC`
    );
    res.json(opportunities.rows);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Merchant Investment Performance
router.get('/performance', verifyToken, async (req: any, res) => {
  try {
    const performance = await pool.query(
      `SELECT 
        COUNT(DISTINCT ii.investor_id) as total_investors,
        COUNT(*) as total_investments,
        SUM(ii.amount) as total_invested,
        SUM(ii.expected_return) as expected_returns,
        AVG(i.profit_percentage) as avg_profit_percentage
       FROM investments i
       LEFT JOIN investor_investments ii ON i.id = ii.investment_id
       WHERE i.merchant_id = $1`,
      [req.user.id]
    );
    res.json(performance.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Profit Distribution History
router.get('/profit-history', verifyToken, async (req: any, res) => {
  try {
    const history = await pool.query(
      `SELECT pd.*, i.project_name
       FROM profit_distributions pd
       JOIN investments i ON pd.investment_id = i.id
       WHERE i.merchant_id = $1
       ORDER BY pd.distributed_at DESC`,
      [req.user.id]
    );
    res.json(history.rows);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Withdraw Earnings (Investor)
router.post('/withdraw', verifyToken, async (req: any, res) => {
  try {
    const { amount } = req.body;

    // Get investor wallet
    const investor = await pool.query('SELECT wallet_balance FROM investor_profiles WHERE user_id = $1', [req.user.id]);
    if (investor.rows.length === 0) {
      return res.status(404).json({ error: 'Investor profile not found' });
    }

    if (investor.rows[0].wallet_balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal
    const withdrawal = await pool.query(
      `INSERT INTO withdrawals (investor_id, amount, status) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, amount, 'pending']
    );

    // Deduct from wallet
    await pool.query(
      'UPDATE investor_profiles SET wallet_balance = wallet_balance - $1 WHERE user_id = $2',
      [amount, req.user.id]
    );

    res.status(201).json(withdrawal.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

export default router;
