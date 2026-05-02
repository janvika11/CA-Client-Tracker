# Database Models Documentation

Complete reference for all Mongoose models in the CA Tracking system.

## User Model

```javascript
{
  name: String,                    // User's full name
  email: String,                   // Unique email, validated
  passwordHash: String,            // Bcrypt hashed password (10 rounds)
  role: String,                    // 'owner' or 'staff'
  firmDetails: {
    firmName: String,              // Practice/Firm name
    address: String,               // Office address
    logo: String                   // Logo URL
  },
  firmId: ObjectId,                // Reference to parent firm (for multi-user)
  timestamps: true                 // createdAt, updatedAt
}
```

**Methods:**
- `comparePassword(candidatePassword)` - Compare plaintext with hashed password

**Indexes:**
- email (unique)
- firmId

---

## Service Model

```javascript
{
  name: String,                    // Service name (e.g., "GST Monthly Filing")
  code: String,                    // Unique service code (e.g., "GST-MF")
  category: String,                // Enum: 'GST', 'TDS', 'Income Tax', 'ROC', 'Audit', 'Advisory', 'Other'
  defaultPrice: Number,            // Base pricing in ₹
  billingCycle: String,            // Enum: 'monthly', 'quarterly', 'half_yearly', 'annual', 'one_time'
  description: String,             // Service description
  isActive: Boolean,               // Service active status
  firmId: ObjectId,                // Reference to User (firm owner)
  timestamps: true                 // createdAt, updatedAt
}
```

**Sample Data:**
- GST Monthly Filing (₹2,500/month)
- GST Annual Return (₹15,000/year)
- TDS Quarterly Filing (₹3,500/quarter)
- ITR Filing (₹8,000/year)
- ROC Annual Compliance (₹5,000/year)
- Statutory Audit (₹25,000/year)
- Advisory Retainer (₹12,000/month)
- Bookkeeping Services (₹5,000/month)

---

## Client Model

```javascript
{
  name: String,                    // Client/Company name
  firmName: String,                // Business name if different
  contactPerson: String,           // Contact person name
  email: String,                   // Email address (validated)
  phone: String,                   // Phone (validated format)
  whatsapp: String,                // WhatsApp number (10 digits minimum)
  gstin: String,                   // 15-char GSTIN (regex validated)
                                   // Pattern: [0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}
  pan: String,                     // 10-char PAN (regex validated)
                                   // Pattern: [A-Z]{5}[0-9]{4}[A-Z]{1}
  address: String,                 // Full address
  city: String,                    // City
  state: String,                   // State
  pincode: String,                 // 6-digit pincode (regex validated)
  clientSince: Date,               // When client joined (default: now)
  status: String,                  // Enum: 'active', 'inactive', 'onboarding'
  notes: String,                   // Internal notes
  tags: [String],                  // Tags for categorization
  firmId: ObjectId,                // Reference to User (firm owner)
  timestamps: true                 // createdAt, updatedAt
}
```

**Validations:**
- Email: Standard email format
- Phone: Can include +, digits, spaces, hyphens, parentheses
- WhatsApp: 10+ digits
- GSTIN: 15-char format following Indian GSTIN pattern
- PAN: 10-char format following Indian PAN pattern
- Pincode: Exactly 6 digits

**Indexes:**
- firmId
- email
- pan (for tax filing lookups)

---

## ClientService Model

```javascript
{
  clientId: ObjectId,              // Reference to Client
  serviceId: ObjectId,             // Reference to Service
  customPrice: Number,             // Custom pricing (overrides service default)
  billingCycle: String,            // Can override service billing cycle
  startDate: Date,                 // Service start date
  endDate: Date,                   // Service end date (nullable for ongoing)
  isActive: Boolean,               // Whether service is currently active
  firmId: ObjectId,                // Reference to User (firm owner)
  timestamps: true                 // createdAt, updatedAt
}
```

**Relationships:**
- Links clients to services with custom pricing
- Allows per-client billing cycle modifications
- Supports service tenure tracking

**Indexes:**
- clientId
- serviceId
- firmId

---

## BillingEntry Model

```javascript
{
  clientId: ObjectId,              // Reference to Client
  clientServiceId: ObjectId,       // Reference to ClientService (for line items)
  serviceId: ObjectId,             // Reference to Service (denormalized for queries)
  financialYear: String,           // Format: "2023-2024" (required)
  period: {
    month: Number,                 // 1-12
    quarter: Number,               // 1-4
    year: Number,                  // Calendar year
    label: String                  // Human-readable: "FY 2023-2024 - Q2"
  },
  amount: Number,                  // Invoice amount in ₹
  status: String,                  // Enum: 'pending', 'paid', 'partially_paid', 'overdue', 'waived'
  amountPaid: Number,              // Amount paid so far (default: 0)
  balance: Number,                 // Calculated: amount - amountPaid
  dueDate: Date,                   // Payment due date
  paidOn: Date,                    // Actual payment date
  paymentMode: String,             // Enum: 'cash', 'upi', 'bank_transfer', 'cheque', null
  paymentReference: String,        // Cheque #, UTR, Transaction ID, etc.
  notes: String,                   // Internal notes
  carriedForwardFrom: ObjectId,    // Reference to previous billing entry (for adjustments)
  firmId: ObjectId,                // Reference to User (firm owner)
  timestamps: true                 // createdAt, updatedAt
}
```

**Status Workflow:**
- pending → paid / partially_paid / overdue
- partially_paid → paid / overdue
- overdue → paid / partially_paid / waived

**Indexes:**
- clientId (find all invoices for a client)
- financialYear (reporting by FY)
- period.year + period.month (monthly reports)
- status (find pending/overdue)
- firmId

---

## Payment Model

```javascript
{
  clientId: ObjectId,              // Reference to Client
  invoiceIds: [ObjectId],          // Array of BillingEntry references (multiple invoices)
  amount: Number,                  // Payment amount in ₹
  mode: String,                    // Enum: 'cash', 'upi', 'bank_transfer', 'cheque'
  reference: String,               // Payment reference (UTR, Cheque #, etc.)
  receivedOn: Date,                // When payment was received
  notes: String,                   // Payment notes/reconciliation info
  firmId: ObjectId,                // Reference to User (firm owner)
  timestamps: true                 // createdAt, updatedAt
}
```

**Relationships:**
- One payment can settle multiple invoices
- Tracks all payment methods
- Linked to billing entries for reconciliation

**Indexes:**
- clientId (find all payments from a client)
- firmId
- receivedOn (for revenue recognition)

---

## Data Relationships

```
User (Firm Owner)
├── Multiple Services
├── Multiple Clients
│   ├── Multiple ClientServices
│   │   └── BillingEntries
│   └── Multiple Payments
└── Multiple BillingEntries
    └── Multiple Payments
```

---

## Query Examples

### Find all pending invoices for a client in a FY
```javascript
BillingEntry.find({
  clientId: clientId,
  financialYear: "2023-2024",
  status: { $in: ["pending", "overdue"] }
});
```

### Get revenue by service for a period
```javascript
BillingEntry.aggregate([
  { $match: { firmId: firmId, financialYear: "2023-2024" } },
  { $group: { _id: "$serviceId", total: { $sum: "$amount" } } },
  { $lookup: { from: "services", localField: "_id", foreignField: "_id", as: "service" } }
]);
```

### Find partially paid invoices
```javascript
BillingEntry.find({
  firmId: firmId,
  status: "partially_paid"
}).populate("clientId", "name email")
  .populate("serviceId", "name");
```

### Get payment collection rate
```javascript
const total = await BillingEntry.countDocuments({ firmId });
const paid = await BillingEntry.countDocuments({ firmId, status: "paid" });
const collectionRate = (paid / total) * 100;
```

---

## Seed Data Statistics

**Demo Organization:**
- 1 Firm Owner (demo@ca.com)
- 8 Services across 7 categories
- 15 Clients (13 active, 1 inactive, 1 onboarding)
- 60+ Client-Service subscriptions
- 500+ Billing entries (6-month history)
- 300+ Payment records

**Payment Status Distribution:**
- ~50% Fully paid
- ~20% Partially paid
- ~15% Pending
- ~15% Overdue

---

## Validation Rules Summary

| Field | Validation |
|-------|-----------|
| GSTIN | 15 chars, pattern: `[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}` |
| PAN | 10 chars, pattern: `[A-Z]{5}[0-9]{4}[A-Z]{1}` |
| Email | Standard email format |
| Phone | Formatted: +91-9876543210 or 9876543210 |
| Pincode | Exactly 6 digits |
| Amount | Non-negative number |
| Financial Year | Format: YYYY-YYYY (e.g., 2023-2024) |

