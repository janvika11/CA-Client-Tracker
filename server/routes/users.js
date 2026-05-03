import express from 'express';
import { authenticate, requireOwner } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { inviteUserSchema } from '../utils/validators.js';
import { createInvitedUser, listTeamUsers } from '../controllers/usersController.js';

const router = express.Router();

router.get('/', authenticate, requireOwner, listTeamUsers);
router.post('/', authenticate, requireOwner, validateRequest(inviteUserSchema), createInvitedUser);

export default router;
