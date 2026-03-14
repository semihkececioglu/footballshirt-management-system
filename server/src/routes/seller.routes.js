import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getSellers, createSeller, updateSeller, deleteSeller } from '../controllers/seller.controller.js';

const router = Router();
router.use(authenticate);
router.get('/', getSellers);
router.post('/', createSeller);
router.put('/:id', updateSeller);
router.delete('/:id', deleteSeller);
export default router;
