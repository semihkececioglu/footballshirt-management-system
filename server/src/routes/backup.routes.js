import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { exportBackup } from '../controllers/backup.controller.js';

const router = Router();
router.use(authenticate);
router.get('/export', exportBackup);

export default router;
