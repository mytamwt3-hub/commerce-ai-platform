import { Worker, Job } from 'bullmq';
import Redis from '../lib/redis';
import * as Service from '../services/investment.service';
import * as Idem from '../models/idempotency.model';
import * as Admin from '../models/adminSettings.model';

const worker = new Worker('investment', async (job: Job) => {
  try {
    const { type, payload, idempotencyKey } = job.data as any;
    if (!type) throw new Error('Missing job type');

    if (type === 'sale') {
      if (!idempotencyKey) throw new Error('Missing idempotencyKey');
      const already = await Idem.isProcessed(idempotencyKey);
      if (already) return { ok: true, idempotent: true };
      await Service.handleSaleWebhook(payload);
      await Idem.markProcessed(idempotencyKey);
      return { ok: true };
    }

    if (type === 'delivery_confirmed') {
      if (!idempotencyKey) throw new Error('Missing idempotencyKey');
      const already = await Idem.isProcessed(idempotencyKey);
      if (already) return { ok: true, idempotent: true };

      const { requestId, quantity, unitPrice, orderId, productId, deliveryId } = payload;

      // Check admin setting whether auto-distribute is enabled
      const auto = await Admin.getBoolean('auto_distribute');
      if (!auto) {
        console.log('[worker] auto_distribute disabled - skipping distribution for order', orderId || '(no orderId)');
        // mark sale as pending_admin so admin can later trigger distribution
        try {
          if (orderId) {
            const SaleModel = require('../models/sale.model');
            await SaleModel.markSalePendingAdmin(orderId);
          }
        } catch (e) {
          console.error('[worker] failed to mark sale pending_admin', e);
        }
        await Idem.markProcessed(idempotencyKey);
        return { ok: true, skipped: true };
      }

      // Release escrows and then distribute
      await Service.releaseEscrowsForRequest(requestId, { orderId, quantity, unitPrice, productId });
      await Idem.markProcessed(idempotencyKey);
      return { ok: true };
    }

    throw new Error('Unsupported job type');
  } catch (err) {
    console.error('[worker] error', err);
    throw err;
  }
}, { connection: (Redis as any) });

worker.on('failed', (job, err) => {
  console.error(`[worker] job failed id=${job.id} name=${job.name} error=${err?.message}`);
});

worker.on('completed', (job) => {
  console.log(`[worker] job completed id=${job.id} name=${job.name}`);
});

console.log('Investment worker started');
