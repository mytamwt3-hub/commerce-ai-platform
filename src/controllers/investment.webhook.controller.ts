import crypto from 'crypto';
import { Request, Response } from 'express';
import { investmentQueue } from '../queues/investment.queue';
import * as Idem from '../models/idempotency.model';

export async function webhookSaleHandler(req: Request, res: Response) {
  try {
    const secret = process.env.INVESTMENT_WEBHOOK_SECRET;
    const signatureHeader = (req.headers['x-signature'] || req.headers['x-investment-webhook-signature'] || req.headers['x-investment-webhook-secret']) as string | undefined;

    if (!secret) return res.status(500).json({ error: 'Server webhook secret not configured' });
    if (!signatureHeader) return res.status(401).json({ error: 'Unauthorized - missing signature' });

    // Compute HMAC over stringified body
    const payloadString = JSON.stringify(req.body || {});
    const expected = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))) {
      return res.status(401).json({ error: 'Unauthorized - invalid signature' });
    }

    const { requestId, productId, orderId, quantity, unitPrice } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

    const idempotencyKey = String(orderId);
    const already = await Idem.isProcessed(idempotencyKey);
    if (already) {
      return res.status(200).json({ ok: true, idempotent: true });
    }

    // enqueue job for worker to process
    await investmentQueue.add('sale', { type: 'sale', payload: { requestId, productId, orderId, quantity, unitPrice }, idempotencyKey }, { removeOnComplete: true, attempts: 5, backoff: { type: 'exponential', delay: 1000 } });

    return res.status(202).json({ ok: true });
  } catch (err: any) {
    console.error('webhookSaleHandler error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
