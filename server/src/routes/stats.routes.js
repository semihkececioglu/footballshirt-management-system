import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getOverview, getMonthlySales, getMonthlyPurchases, getTeamStats, getSizeStats, getPlatformStats, getBuyerStats, getCounts, getAverageSaleTime } from '../controllers/stats.controller.js';

const router = Router();
router.use(authenticate);
router.get('/counts', getCounts);
router.get('/overview', getOverview);
router.get('/monthly-sales', getMonthlySales);
router.get('/monthly-purchases', getMonthlyPurchases);
router.get('/teams', getTeamStats);
router.get('/sizes', getSizeStats);
router.get('/platforms', getPlatformStats);
router.get('/buyers', getBuyerStats);
router.get('/average-sale-time', getAverageSaleTime);
export default router;
