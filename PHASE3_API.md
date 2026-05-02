# Phase 3: Billing Generation + Payments API

Complete reference for billing and payment endpoints with FIFO allocation and cron automation.

---

## 🧮 Billing Generation Service

### Core Logic

**generateBillingForMonth(month, year, firmId)**
- Finds all active ClientServices for the firm
- Creates BillingEntry for each service if not already generated
- Respects billing cycles (monthly, quarterly, half_yearly, annual)
- Sets dueDate to 10th of the billing month
- Links unpaid prior entries via carriedForwardFrom

**Billing Cycle Behavior:**
- **monthly**: Generate every month
- **quarterly**: Generate 1st month of quarter (Apr, Jul, Oct, Jan)
- **half_yearly**: Generate Apr and Oct
- **annual**: Generate Apr (FY start)
- **one_time**: Never auto-generate

---

## 🤖 Cron Jobs

### Auto-run Schedule

**1. Monthly Billing Generation**
```
Time: 1st of every month at 2:00 AM
Task: Generates billing for previous month for all firms
Logs: Created entries count per firm
```

**2. Daily Overdue Marking**
```
Time: Daily at 3:00 AM
Task: Marks pending/partially_paid as overdue if dueDate < today
Logs: Modified count per firm
```

---

## 💰 Payment Processing

### FIFO Allocation Logic

When recording a payment:
1. Get all unpaid invoices for client (oldest first by dueDate)
2. Allocate payment amount across invoices
3. Update each BillingEntry with:
   - amountPaid += allocated amount
   - balance = amount - amountPaid
   - status: paid (if balance = 0) | partially_paid (if balance > 0) | pending
   - paidOn: set when fully paid
   - paymentMode & paymentReference

Example: Client owes ₹10000 + ₹5000. Payment of ₹12000:
- First invoice: ₹10000 (marked as paid)
- Second invoice: ₹2000 (updated to ₹3000 remaining, partially_paid)
- Remaining: ₹0 (no carryforward)

---

## 📊 Billing Endpoints

### 1. Generate Billing (Manual Trigger)
```
POST /api/billing/generate
```

**Request Body:**
```json
{
  "month": 1,
  "year": 2025
}
```

**Validation:**
- month: 1-12
- year: 2020-2099

**Response (200):**
```json
{
  "success": true,
  "message": "Billing generated for month 1/2025",
  "data": {
    "success": true,
    "month": 1,
    "year": 2025,
    "fy": "2024-25",
    "created": 8,
    "details": [
      {
        "clientName": "Acme Manufacturing",
        "serviceName": "GST Monthly Filing",
        "amount": 2700,
        "billingId": "507f1f77bcf86cd799439014"
      }
    ],
    "errors": null
  }
}
```

---

### 2. Get Billing Matrix (FY Overview)
```
GET /api/billing/matrix?fy=2025-26
```

**Query Parameters:**
- `fy` (required) - Financial year in format YYYY-YY (e.g., "2025-26")

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "fy": "2025-26",
    "matrix": [
      {
        "clientId": "507f1f77bcf86cd799439013",
        "clientName": "Acme Manufacturing Ltd",
        "status": "active",
        "months": {
          "1": [
            {
              "service": "GST Monthly Filing",
              "category": "GST",
              "amount": 2700,
              "paid": 2700,
              "balance": 0,
              "status": "paid",
              "dueDate": "2025-01-10T00:00:00.000Z"
            }
          ]
        },
        "totals": {
          "totalAmount": 32400,
          "totalPaid": 27400,
          "totalBalance": 5000,
          "outstanding": [
            {
              "month": "3",
              "service": "Advisory Retainer",
              "amount": 5000,
              "status": "pending"
            }
          ]
        }
      }
    ],
    "summary": {
      "totalClients": 15,
      "totalBillings": 120,
      "totalAmount": 485000,
      "totalPaid": 425000,
      "totalOutstanding": 60000
    }
  }
}
```

---

### 3. List Billing Entries
```
GET /api/billing/entries?page=1&limit=20&clientId=&status=&fy=&month=
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `clientId` - Filter by client
- `status` - pending, paid, partially_paid, overdue, waived
- `fy` - Financial year (e.g., "2025-26")
- `month` - Month number (1-12)
- `sortBy` (default: "-createdAt")

**Response (200):**
```json
{
  "success": true,
  "data": {
    "billings": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "clientId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Acme Manufacturing",
          "email": "rajesh@acme.com"
        },
        "serviceId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "GST Monthly Filing",
          "code": "GST-MF",
          "category": "GST"
        },
        "financialYear": "2025-26",
        "period": {
          "month": 4,
          "year": 2025,
          "label": "Apr 2025"
        },
        "amount": 2700,
        "status": "partially_paid",
        "amountPaid": 1350,
        "balance": 1350,
        "dueDate": "2025-04-10T00:00:00.000Z",
        "paidOn": "2025-04-15T00:00:00.000Z",
        "paymentMode": "bank_transfer",
        "paymentReference": "UTR123456"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 120,
      "pages": 6
    }
  }
}
```

---

### 4. Get Single Billing Entry
```
GET /api/billing/entries/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "billing": { /* full billing entry */ }
  }
}
```

---

### 5. Update Billing Status
```
PUT /api/billing/entries/:id
```

**Request Body:**
```json
{
  "status": "paid",
  "notes": "Manually marked as paid"
}
```

**Valid Statuses:**
- pending
- paid
- partially_paid
- overdue
- waived

**Response (200):**
```json
{
  "success": true,
  "message": "Billing status updated",
  "data": { "billing": { /* updated entry */ } }
}
```

---

### 6. Get Billing Statistics
```
GET /api/billing/stats?fy=2025-26
```

**Query Parameters:**
- `fy` (optional) - Filter by financial year

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalBillings": 120,
      "totalAmount": 485000,
      "totalPaid": 425000,
      "totalBalance": 60000,
      "byStatus": {
        "paid": {
          "count": 85,
          "amount": 425000,
          "paid": 425000,
          "balance": 0
        },
        "partially_paid": {
          "count": 15,
          "amount": 40000,
          "paid": 15000,
          "balance": 25000
        },
        "pending": {
          "count": 12,
          "amount": 15000,
          "paid": 0,
          "balance": 15000
        },
        "overdue": {
          "count": 8,
          "amount": 5000,
          "paid": 0,
          "balance": 5000
        }
      }
    },
    "collectionRate": "87.63"
  }
}
```

---

### 7. Mark Overdue (Manual Trigger)
```
POST /api/billing/mark-overdue
```

**Response (200):**
```json
{
  "success": true,
  "message": "Overdue billings marked",
  "data": {
    "success": true,
    "modifiedCount": 5
  }
}
```

---

## 💳 Payment Endpoints

### 1. Record Payment (FIFO Allocation)
```
POST /api/payments
```

**Request Body:**
```json
{
  "clientId": "507f1f77bcf86cd799439013",
  "invoiceIds": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"],
  "amount": 8500,
  "mode": "bank_transfer",
  "reference": "UTR202501234567",
  "receivedOn": "2025-01-15T10:30:00Z",
  "notes": "Payment received via bank"
}
```

**Validation:**
- `clientId`: valid MongoDB ID
- `invoiceIds`: optional (if not provided, uses FIFO on unpaid)
- `amount`: positive number
- `mode`: cash, upi, bank_transfer, cheque
- `reference`: required, unique per payment

**Response (201):**
```json
{
  "success": true,
  "message": "Payment recorded and allocated",
  "data": {
    "payment": {
      "_id": "507f1f77bcf86cd799439020",
      "clientId": "507f1f77bcf86cd799439013",
      "invoiceIds": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"],
      "amount": 8500,
      "mode": "bank_transfer",
      "reference": "UTR202501234567",
      "receivedOn": "2025-01-15T10:30:00.000Z",
      "notes": "Payment received via bank",
      "createdAt": "2025-01-15T10:31:00.000Z"
    },
    "allocations": [
      {
        "invoiceId": "507f1f77bcf86cd799439014",
        "invoiceAmount": 10000,
        "allocatedAmount": 8500,
        "newStatus": "partially_paid",
        "period": {
          "month": 4,
          "year": 2025,
          "label": "Apr 2025"
        }
      }
    ],
    "unallocatedAmount": 0,
    "summary": {
      "totalAllocated": 8500,
      "invoicesUpdated": 1
    }
  }
}
```

---

### 2. List Payments
```
GET /api/payments?page=1&limit=20&clientId=&mode=
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `clientId` - Filter by client
- `mode` - cash, upi, bank_transfer, cheque
- `sortBy` (default: "-receivedOn")

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "clientId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Acme Manufacturing",
          "email": "rajesh@acme.com"
        },
        "invoiceIds": [
          {
            "_id": "507f1f77bcf86cd799439014",
            "amount": 10000,
            "status": "partially_paid",
            "period": { "month": 4, "year": 2025 }
          }
        ],
        "amount": 8500,
        "mode": "bank_transfer",
        "reference": "UTR202501234567",
        "receivedOn": "2025-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

### 3. Get Single Payment
```
GET /api/payments/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payment": { /* payment with populated fields */ }
  }
}
```

---

### 4. Get Payment Statistics
```
GET /api/payments/stats?startDate=2025-01-01&endDate=2025-01-31
```

**Query Parameters:**
- `startDate` (optional) - Filter from date
- `endDate` (optional) - Filter to date

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalPayments": 35,
      "totalAmount": 425000,
      "byMode": {
        "bank_transfer": {
          "count": 20,
          "amount": 325000
        },
        "cheque": {
          "count": 10,
          "amount": 75000
        },
        "upi": {
          "count": 5,
          "amount": 25000
        }
      }
    }
  }
}
```

---

### 5. Get Client Payment History
```
GET /api/payments/client/:clientId?page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": "507f1f77bcf86cd799439013",
      "name": "Acme Manufacturing Ltd",
      "email": "rajesh@acme.com"
    },
    "payments": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "amount": 8500,
        "mode": "bank_transfer",
        "reference": "UTR202501234567",
        "receivedOn": "2025-01-15T10:30:00.000Z",
        "invoiceIds": [ /* populated invoices */ ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 32,
      "pages": 4
    }
  }
}
```

---

## 📅 Financial Year Utilities

### Indian FY System (April - March)

**getFY(date)** → "2025-26"
- April 2025 → "2025-26"
- March 2026 → "2025-26"
- January 2025 → "2024-25"

**getPeriodLabel(month, year, cycle)**
- Monthly: "Apr 2025"
- Quarterly: "Q1 FY 2025-26 (Apr-Jun)"
- Half-yearly: "H1 FY 2025-26 (Apr-Sep 2025)"
- Annual: "FY 2025-26"

**getMonthsInFY(fy)** → [{month, year}, ...]
- "2025-26" → Apr 2025 through Mar 2026

**getQuartersInFY(fy)** → [Q1, Q2, Q3, Q4]

---

## 🔄 FIFO Payment Allocation Example

**Scenario:**
- Client has 3 unpaid invoices:
  - Invoice A: ₹5000, dueDate: 2025-01-10 (oldest)
  - Invoice B: ₹7000, dueDate: 2025-02-10
  - Invoice C: ₹4000, dueDate: 2025-03-10

- Payment received: ₹10000

**FIFO Allocation:**
1. Invoice A: ₹5000 (fully paid) → status = "paid"
2. Invoice B: ₹5000 of ₹7000 (partially paid) → status = "partially_paid", balance = ₹2000
3. Invoice C: Not touched (₹0 remaining)

**Result:**
- A: paid from ₹5000
- B: paid from ₹5000 + owes ₹2000
- C: still owes ₹4000

---

## 🔐 Security & Access

All billing and payment endpoints require:
- ✅ JWT authentication (via httpOnly cookie)
- ✅ firmId validation (only own data)
- ✅ Rate limiting (100 req/15min)
- ✅ Input validation (Zod)
- ✅ Error handling

---

## 📊 Sample cURL Commands

### Generate Billing
```bash
curl -X POST http://localhost:5000/api/billing/generate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"month": 1, "year": 2025}'
```

### Record Payment with FIFO
```bash
curl -X POST http://localhost:5000/api/payments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "clientId": "507f1f77bcf86cd799439013",
    "amount": 15000,
    "mode": "bank_transfer",
    "reference": "UTR123456"
  }'
```

### Get Billing Matrix for FY
```bash
curl "http://localhost:5000/api/billing/matrix?fy=2025-26" \
  -b cookies.txt
```

### List Pending Billings
```bash
curl "http://localhost:5000/api/billing/entries?status=pending&sortBy=-dueDate" \
  -b cookies.txt
```

---

## ✨ Key Features

✅ **Indian FY Support** - April to March financial years
✅ **Smart Billing Cycles** - Auto-generation based on subscription type
✅ **FIFO Payments** - Intelligent allocation across invoices
✅ **Cron Automation** - Auto-billing and overdue marking
✅ **Carried Forward** - Track prior unpaid amounts
✅ **Status Tracking** - 5 billing statuses (pending, paid, partial, overdue, waived)
✅ **Payment Modes** - 4 modes (cash, UPI, bank transfer, cheque)
✅ **Analytics** - Collection rates, stats, matrix views

