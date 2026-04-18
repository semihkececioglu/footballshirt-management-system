import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createSale, getSales, getSaleFilterOptions, getSale, updateSale, deleteSale, markAsReturned } from '../controllers/sale.controller.js';

const router = Router();
router.use(authenticate);
router.get('/filter-options', getSaleFilterOptions);
router.get('/', getSales);
router.post('/', createSale);
router.get('/:id', getSale);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);
router.patch('/:id/return', markAsReturned);
export default router;
