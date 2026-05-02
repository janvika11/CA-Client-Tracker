# API Implementation Guide

Quick reference for building RESTful endpoints for the CA Tracker.

## API Endpoint Structure

```
/api
├── /auth
│   ├── POST /register
│   ├── POST /login
│   └── POST /logout
├── /users
│   ├── GET / (list users for firm)
│   ├── POST / (create user)
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── /clients
│   ├── GET / (list all clients)
│   ├── POST / (create client)
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   ├── GET /:id/services (get services for client)
│   └── GET /:id/billing (get billing history)
├── /services
│   ├── GET / (list all services)
│   ├── POST / (create service)
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── /client-services
│   ├── GET / (list subscriptions)
│   ├── POST / (assign service to client)
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── /billing
│   ├── GET / (list billing entries)
│   ├── POST / (create billing entry)
│   ├── GET /:id
│   ├── PUT /:id
│   ├── PUT /:id/status (update status)
│   ├── DELETE /:id
│   ├── GET /client/:clientId (get client billing)
│   ├── GET /fy/:financialYear (get FY billing)
│   └── GET /report (get billing report)
└── /payments
    ├── GET / (list payments)
    ├── POST / (record payment)
    ├── GET /:id
    ├── PUT /:id
    ├── DELETE /:id
    ├── GET /client/:clientId (get client payments)
    └── POST /:id/reconcile (reconcile with invoices)
```

## Sample Route Implementation

### List Clients
```javascript
// server/routes/clients.js
import express from 'express';
import Client from '../models/Client.js';

const router = express.Router();

// GET /api/clients
router.get('/', async (req, res, next) => {
  try {
    // Typically filtered by firmId from authenticated user
    const clients = await Client.find({ firmId: req.user.firmId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: clients,
      count: clients.length
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, gstin, pan, ...rest } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Check duplicate email
    const existing = await Client.findOne({ email, firmId: req.user.firmId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email already exists'
      });
    }

    const client = await Client.create({
      name,
      email,
      phone,
      gstin,
      pan,
      firmId: req.user.firmId,
      ...rest
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Create Billing Entry
```javascript
// Handle custom price or use service's default
router.post('/billing', async (req, res, next) => {
  try {
    const {
      clientId,
      clientServiceId,
      serviceId,
      financialYear,
      period,
      amount,
      dueDate,
      ...rest
    } = req.body;

    // Fetch client and service to validate
    const [client, service] = await Promise.all([
      Client.findById(clientId),
      Service.findById(serviceId)
    ]);

    if (!client || !service) {
      return res.status(404).json({
        success: false,
        message: 'Client or Service not found'
      });
    }

    // Use provided amount or service's default price
    const billingAmount = amount || service.defaultPrice;

    // Calculate due date if not provided (15 days from period start)
    let calcDueDate = dueDate;
    if (!dueDate) {
      calcDueDate = new Date();
      calcDueDate.setDate(calcDueDate.getDate() + 15);
    }

    const billing = await BillingEntry.create({
      clientId,
      clientServiceId,
      serviceId,
      financialYear,
      period,
      amount: billingAmount,
      dueDate: calcDueDate,
      balance: billingAmount,
      firmId: req.user.firmId,
      ...rest
    });

    res.status(201).json({
      success: true,
      message: 'Billing entry created',
      data: billing
    });
  } catch (error) {
    next(error);
  }
});
```

### Record Payment with Invoice Settlement
```javascript
router.post('/payments', async (req, res, next) => {
  try {
    const { clientId, invoiceIds, amount, mode, reference, receivedOn } = req.body;

    // Validate invoices exist and belong to client
    const invoices = await BillingEntry.find({
      _id: { $in: invoiceIds },
      clientId,
      firmId: req.user.firmId
    });

    if (invoices.length !== invoiceIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more invoices not found'
      });
    }

    // Create payment record
    const payment = await Payment.create({
      clientId,
      invoiceIds,
      amount,
      mode,
      reference,
      receivedOn: receivedOn || new Date(),
      firmId: req.user.firmId
    });

    // Update billing entries - simple approach
    // In production, use transactions for safety
    let remainingPayment = amount;
    for (const invoice of invoices) {
      const outstanding = invoice.amount - invoice.amountPaid;
      const paymentForThisInvoice = Math.min(remainingPayment, outstanding);

      const newAmountPaid = invoice.amountPaid + paymentForThisInvoice;
      const newBalance = invoice.amount - newAmountPaid;

      let newStatus = 'pending';
      if (newBalance === 0) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partially_paid';
      }

      await BillingEntry.findByIdAndUpdate(invoice._id, {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
        paidOn: newStatus === 'paid' ? new Date() : invoice.paidOn,
        paymentMode: mode,
        paymentReference: reference
      });

      remainingPayment -= paymentForThisInvoice;
      if (remainingPayment <= 0) break;
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded and invoices updated',
      data: payment
    });
  } catch (error) {
    next(error);
  }
});
```

## Error Handling Pattern

```javascript
// Global error handler (server.js)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${new Date().toISOString()}] ${status} - ${message}`);

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

## Response Format Standard

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "count": 15
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## Middleware Examples

### Authentication Middleware
```javascript
import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
```

### Validation Middleware
```javascript
export const validateClient = (req, res, next) => {
  const { name, email } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  if (!email?.match(/.+@.+\..+/)) {
    return res.status(400).json({ success: false, message: 'Invalid email' });
  }

  next();
};
```

## Key Implementation Considerations

1. **Firmware ID**: Always filter by `firmId` to ensure multi-tenant isolation
2. **Pagination**: Implement for list endpoints with defaults (skip: 0, limit: 20)
3. **Sorting**: Support sorting by common fields (createdAt, name)
4. **Filtering**: Support status, category, date range filters
5. **Timestamps**: Automatically managed by Mongoose
6. **Transactions**: Use for payment reconciliation to ensure atomicity
7. **Validation**: Use both schema validation + route-level validation
8. **Logging**: Log all payment and billing changes
9. **Audit Trail**: Consider storing change history for GST compliance
10. **Rate Limiting**: Implement for production APIs

## Next Steps

1. Create authentication routes (/auth/login, /auth/register)
2. Implement middleware for authentication and authorization
3. Build CRUD endpoints for each model
4. Add filtering, sorting, pagination
5. Implement reporting endpoints
6. Add webhook support for payment notifications
7. Create admin APIs for firm management

