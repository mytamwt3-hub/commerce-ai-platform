import { Worker, Job } from 'bullmq';
import Redis from '../lib/redis';
import * as Service from '../services/investment.service';
import * as Idem from '../models/idempotency.model';

const worker = new Worker('investment', async (job: Job) => {
  try {
    const { type, payload, idempotencyKey } = job.data as any;
    if (!type) throw new Error('Missing job type');

    // Only support sale processing here
    if (type === 'sale') {
      if (!idempotencyKey) {
        throw new Error('Missing idempotencyKey');
      }

      const already = await Idem.isProcessed(idempotencyKey);
      if (already) {
        console.log('[worker] idempotent - already processed', idempotencyKey);
        return { ok: true, idempotent: true };
      }

      // call service which executes DB transactions
      await Service.handleSaleWebhook(payload);

      // mark processed
      await Idem.markProcessed(idempotencyKey);

      console.log('[worker] processed sale', idempotencyKey);
      return { ok: true };
    }

    throw new Error('Unsupported job type');
  } catch (err) {
    console.error('[worker] error', err);
    throw err;
  }
}, { connection: (Redis as any) });

worker.on('failed', (job, err) => {
  console.error(`[worker] job failed id=${job.id} name=${job.name} error=${err.message}`);
});

worker.on('completed', (job) => {
  console.log(`[worker] job completed id=${job.id} name=${job.name}`);
});

console.log('Investment worker started');
