import express from 'express';
import { login, logout, getCurrentUser } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { loginSchema } from '../utils/validators.js';

const router = express.Router();

router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
