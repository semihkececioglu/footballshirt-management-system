import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  getJerseys, getJersey, createJersey, updateJersey,
  deleteJersey, duplicateJersey, markSold,
  deleteImage_handler, bulkDelete, bulkUpdatePrice, bulkUpdateStatus,
  getFilterOptions, toggleFeatured,
} from '../controllers/jersey.controller.js';

const router = Router();
router.use(authenticate);

// Static routes first (must come before /:id)
router.get('/filter-options', getFilterOptions);
router.delete('/bulk', bulkDelete);
router.patch('/bulk/price', bulkUpdatePrice);
router.patch('/bulk/status', bulkUpdateStatus);
router.post('/images/delete', deleteImage_handler);

// Collection routes
router.get('/', getJerseys);
router.post('/', upload.array('images', 10), createJersey);

// Dynamic :id routes
router.get('/:id', getJersey);
router.put('/:id', upload.array('images', 10), updateJersey);
router.delete('/:id', deleteJersey);
router.post('/:id/duplicate', duplicateJersey);
router.post('/:id/mark-sold', markSold);
router.patch('/:id/featured', toggleFeatured);

export default router;
