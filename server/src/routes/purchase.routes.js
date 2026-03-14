import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  getPurchases, getPurchaseFilterOptions, promotePurchase, demotePurchase,
  createPurchase, updatePurchase, deletePurchase,
} from '../controllers/purchase.controller.js';

const router = Router();
router.use(authenticate);
router.get('/filter-options', getPurchaseFilterOptions);
router.get('/', getPurchases);
router.post('/', upload.array('images', 10), createPurchase);
router.post('/:id/promote', promotePurchase);
router.delete('/:id/demote', demotePurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);
export default router;
