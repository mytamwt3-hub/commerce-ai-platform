import { Request, Response } from 'express';
import * as Admin from '../models/adminSettings.model';
import { investmentQueue } from '../queues/investment.queue';

export async function getSettingHandler(req: Request, res: Response) {
  try {
    const { key } = req.params;
    const value = await Admin.getSetting(key);
    if (!value) return res.status(404).json({ error: 'Not found' });
    res.json(value);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function setSettingHandler(req: Request, res: Response) {
  try {
    const { key } = req.params;
    const value = req.body;
    const updated = await Admin.setSetting(key, value);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

export async function distributeOrderHandler(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ error: 'orderId required' });

    // enqueue manual distribution job regardless of auto_distribute flag
    const idempotencyKey = `admin:distribute:${orderId}`;
    await investmentQueue.add('manual_release', { type: 'delivery_confirmed', payload: { orderId }, idempotencyKey }, { removeOnComplete: true, attempts: 5, backoff: { type: 'exponential', delay: 1000 } });

    res.json({ ok: true, enqueued: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
