import { Request, Response } from 'express';
import * as Admin from '../models/adminSettings.model';

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
