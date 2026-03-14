import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { getReminders, createReminder, updateReminder, deleteReminder } from '../controllers/reminder.controller.js';

const router = Router();
router.use(authenticate);
router.get('/', getReminders);
router.post('/', upload.single('image'), createReminder);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);
export default router;
