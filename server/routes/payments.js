import express from 'express';
import {
  recordPayment,
  listPayments,
  getPayment,
  getPaymentStats,
  getClientPaymentHistory
} from '../controllers/paymentsController.js';
import { authenticate } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validation.js';
import { paginationSchema } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

// Record a payment
router.post('/', recordPayment);

// Get payment statistics
router.get('/stats', getPaymentStats);

// Get payment history for a specific client
router.get('/client/:clientId', getClientPaymentHistory);

// List all payments
router.get('/', validateQuery(paginationSchema), listPayments);

// Get single payment
router.get('/:id', getPayment);

export default router;
