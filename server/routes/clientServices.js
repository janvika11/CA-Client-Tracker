import express from 'express';
import {
  listClientServices,
  getClientService,
  createClientService,
  updateClientService,
  deleteClientService,
  getClientServices
} from '../controllers/clientServicesController.js';
import { validateRequest, validateQuery } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { clientServiceSchema, paginationSchema } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validateQuery(paginationSchema), listClientServices);
router.post('/', validateRequest(clientServiceSchema), createClientService);
router.get('/:id', getClientService);
router.put('/:id', validateRequest(clientServiceSchema.partial()), updateClientService);
router.delete('/:id', deleteClientService);

// Get all services for a specific client
router.get('/client/:clientId', getClientServices);

export default router;
