import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getMonthlyReport, getAvailableReports } from '../controllers/report.controller.js';

const router = Router();
router.use(authenticate);
router.get('/available', getAvailableReports);
router.get('/:year/:month', getMonthlyReport);
export default router;
