import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getPlannerMonth,
  getPlannerDay,
  createPlanItem,
  updatePlanItem,
  deletePlanItem,
  togglePlanItem,
} from '../controllers/planItem.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', getPlannerMonth);
router.get('/day', getPlannerDay);
router.post('/', createPlanItem);
router.put('/:id', updatePlanItem);
router.delete('/:id', deletePlanItem);
router.patch('/:id/toggle', togglePlanItem);

export default router;
