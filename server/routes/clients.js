import express from 'express';
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/clientsController.js';
import { validateRequest, validateQuery } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { clientSchema, paginationSchema } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validateQuery(paginationSchema), listClients);
router.post('/', validateRequest(clientSchema), createClient);
router.get('/:id', getClient);
router.put('/:id', validateRequest(clientSchema.partial()), updateClient);
router.delete('/:id', deleteClient);

export default router;
