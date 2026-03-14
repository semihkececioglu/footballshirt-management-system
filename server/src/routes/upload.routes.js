import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { uploadImages } from '../controllers/upload.controller.js';

const router = Router();
router.use(authenticate);
router.post('/images', upload.array('images', 10), uploadImages);
export default router;
