import { pool } from '../config/database';

async function reconcile() {
  const client = await pool.connect();
  try {
    // sum wallet balances
    const walletsRes = await client.query('SELECT COALESCE(SUM(balance),0) as total_balance FROM wallets');
    const totalBalance = Number(walletsRes.rows[0].total_balance || 0);

    // sum wallet transactions (credits - debits)
    const creditsRes = await client.query("SELECT COALESCE(SUM(amount),0) as total_credit FROM wallet_transactions WHERE type = 'credit'");
    const debitsRes = await client.query("SELECT COALESCE(SUM(amount),0) as total_debit FROM wallet_transactions WHERE type = 'debit'");
    const totalCredit = Number(creditsRes.rows[0].total_credit || 0);
    const totalDebit = Number(debitsRes.rows[0].total_debit || 0);
    const ledgerBalance = Number((totalCredit - totalDebit).toFixed(2));

    console.log('[reconcile] totalBalance=', totalBalance, 'ledgerBalance=', ledgerBalance);

    if (Math.abs(totalBalance - ledgerBalance) > 0.01) {
      console.error('[reconcile] BALANCE MISMATCH detected', { totalBalance, ledgerBalance, diff: Number((totalBalance - ledgerBalance).toFixed(2)) });
      // In production we would alert here (email/ops) and produce a report
      process.exitCode = 2;
    } else {
      console.log('[reconcile] OK');
    }
  } catch (err) {
    console.error('[reconcile] error', err);
    process.exitCode = 3;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  reconcile().then(() => process.exit()).catch(() => process.exit());
}

export default reconcile;
