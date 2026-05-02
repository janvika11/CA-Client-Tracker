import express from 'express';
import {
  generateBilling,
  getBillingMatrix,
  listBillings,
  getBilling,
  updateBillingStatus,
  markOverdue,
  getBillingStats
} from '../controllers/billingController.js';
import { authenticate } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validation.js';
import { paginationSchema } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

// Generate billing for a month
router.post('/generate', generateBilling);

// Get billing matrix for a financial year
router.get('/matrix', getBillingMatrix);

// Get billing statistics
router.get('/stats', getBillingStats);

// List all billings with filters
router.get('/', validateQuery(paginationSchema), listBillings);

// Get single billing
router.get('/:id', getBilling);

// Update billing status
router.put('/:id', updateBillingStatus);

// Mark overdue billings
router.post('/mark-overdue', markOverdue);

export default router;
