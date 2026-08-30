import express from 'express';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';
import * as Controller from '../controllers/admin.controller';

const router = express.Router();

// require authentication and admin role
router.get('/settings/:key', verifyToken, requireAdmin, Controller.getSettingHandler);
router.put('/settings/:key', verifyToken, requireAdmin, Controller.setSettingHandler);

// Manual distribution endpoint (admin)
router.post('/distribute/:orderId', verifyToken, requireAdmin, Controller.distributeOrderHandler);

export default router;
