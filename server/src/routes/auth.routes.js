import { Router } from 'express';
import { login, hashPassword } from '../controllers/auth.controller.js';

const router = Router();
router.post('/login', login);
router.post('/hash', hashPassword); // For initial setup only
export default router;
