import express from 'express';
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService
} from '../controllers/servicesController.js';
import { validateRequest, validateQuery } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { serviceSchema, paginationSchema } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validateQuery(paginationSchema), listServices);
router.post('/', validateRequest(serviceSchema), createService);
router.get('/:id', getService);
router.put('/:id', validateRequest(serviceSchema.partial()), updateService);
router.delete('/:id', deleteService);

export default router;
