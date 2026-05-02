# CA Practice Management & Billing Tracker

A complete MERN (MongoDB, Express, React, Node.js) stack application for Chartered Accountants to manage clients, services, billing, and payments.

## 📋 Features

- **Client Management**: Add, edit, and manage clients with detailed information
- **Service Catalog**: Define services with pricing and billing cycles
- **Billing System**: Generate and track invoices with multiple payment statuses
- **Payment Tracking**: Record and reconcile client payments
- **Financial Reporting**: Track revenue by financial year, service, and client
- **User Management**: Multi-user support with roles (owner/staff)
- **Data Validation**: GSTIN and PAN regex validation

## 📁 Project Structure

```
ca-tracker/
├── client/                      # React 18 + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API service calls
│   │   ├── App.jsx             # Main app component
│   │   ├── App.css             # App styles
│   │   ├── index.css           # Global styles
│   │   └── main.jsx            # Vite entry point
│   ├── index.html              # HTML template
│   ├── vite.config.js          # Vite configuration
│   ├── package.json
│   └── .gitignore
│
├── server/                      # Express backend
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js             # User model with password hashing
│   │   ├── Client.js           # Client model with GSTIN/PAN validation
│   │   ├── Service.js          # Service offerings
│   │   ├── ClientService.js    # Client-Service relationships
│   │   ├── BillingEntry.js     # Invoice entries
│   │   └── Payment.js          # Payment records
│   ├── routes/                 # API routes (placeholder)
│   ├── controllers/            # Route handlers (placeholder)
│   ├── config/                 # Configuration files
│   ├── server.js               # Express server entry point
│   ├── seed.js                 # Database seeding script
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── package.json                # Root package.json with concurrently
├── .gitignore
└── README.md
```

## 🗄️ Database Models

### User
- Email authentication with bcrypt hashing
- Role-based access (owner/staff)
- Firm details support
- Timestamps

### Client
- GSTIN validation (regex: 15-character format)
- PAN validation (regex: 10-character format)
- Contact information (phone, WhatsApp, email)
- Status tracking (active/inactive/onboarding)
- Tags for categorization
- Relationships to multiple services

### Service
- Name, code, category (GST/TDS/Income Tax/ROC/Audit/Advisory/Other)
- Billing cycles (monthly/quarterly/half_yearly/annual/one_time)
- Default pricing
- Active status

### ClientService
- Maps clients to services with custom pricing
- Flexible billing cycle override
- Start/end date tracking
- Active status management

### BillingEntry
- Client and service references
- Financial year tracking
- Period information (month, quarter, year)
- Status tracking (pending/paid/partially_paid/overdue/waived)
- Amount tracking with balance calculation
- Multiple payment mode support
- Carried forward reference for adjustments

### Payment
- Multiple invoice linking
- Payment mode tracking (cash/UPI/bank transfer/cheque)
- Payment reference
- Received date

## 🔍 Database Indexes

Optimized queries with indexes on:
- `clients`: firmId, email, pan
- `billingEntry`: clientId, financialYear, period.year+month, status
- `payments`: clientId, firmId, receivedOn
- `clientService`: clientId, serviceId, firmId
- `users`: email, firmId

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone or navigate to the project**
   ```bash
   cd ca-tracker
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup environment variables**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your MongoDB URI
   ```

4. **Seed the database (optional)**
   ```bash
   cd server
   npm run seed
   ```

### Running the Application

#### Development Mode (with hot reload)
```bash
npm run dev
```

This will start both servers concurrently:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

### Environment Variables

Create `server/.env` from `server/.env.example` and configure:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - backend port (default `5000`)
- `NODE_ENV` - `development` or `production`
- `DEV_ALLOW_ANY_LOGIN` - In development, leave unset or `true` to accept any login (uses seeded user matching email if found, otherwise the first user). Set `false` to require real passwords.

The frontend axios base URL is set to `http://localhost:5000/api` in `client/src/lib/api.js`.

## 🖥️ Frontend (Phase 5)

Phase 5 includes a full React frontend with:

- Dashboard KPIs, charts, and activity feed
- Payments workflow with FIFO allocation and receipt PDF generation
- Bulk Upload for client imports (`.csv` and `.xlsx`) with mapping and validation
- Reports page with receivables aging, service revenue, FY P&L, and export to Excel/PDF

### Key Routes

- `/login`
- `/`
- `/clients`
- `/clients/:clientId`
- `/bulk-upload`
- `/services`
- `/billing`
- `/payments`
- `/reports`
- `/settings`

### Seed Instructions

```bash
cd server
npm run seed
```

#### Production Build
```bash
npm run build
```

## 📊 Seed Data

The `seed.js` script populates the database with:
- **1 Demo User**: email: `demo@ca.com`, password: `CaTracker_Demo_2026!` (run `npm run seed`; printed in the console too)
- **8 Services**: GST Filing, TDS, ITR, ROC, Audit, Advisory, Bookkeeping
- **15 Clients**: Varied industries with mixed service subscriptions
- **6 Months Billing History**: With realistic payment statuses
  - ~50% fully paid
  - ~20% partially paid
  - ~15% pending
  - ~15% overdue

Total Records Generated:
- 1 User
- 8 Services
- 15 Clients
- 60+ Client-Service relationships
- 500+ Billing entries
- 300+ Payment records

## 🔐 Security Notes

- Passwords are hashed with bcrypt (10 salt rounds)
- GSTIN and PAN are validated with regex patterns
- Email validation included
- Phone number validation included
- Use environment variables for sensitive data (JWT_SECRET, MongoDB URI)

## 📝 API Endpoints (Ready for Implementation)

- `GET /api/health` - Server health check
- `GET /api` - API info and endpoint list
- `/api/users` - User management
- `/api/clients` - Client CRUD operations
- `/api/services` - Service management
- `/api/billing` - Billing entry management
- `/api/payments` - Payment tracking

## 🛠️ Technology Stack

### Frontend
- React 18
- Vite (build tool)
- React Router v6
- Axios (HTTP client)

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose ODM
- bcryptjs (password hashing)
- JWT (authentication)
- CORS (cross-origin support)

## 📄 Scripts

```bash
# Root level
npm run dev              # Run both client and server
npm run build            # Build both client and server
npm run install:all      # Install dependencies for all

# Server only
cd server
npm run dev              # Run with auto-reload
npm run seed             # Populate database with demo data

# Client only
cd client
npm run dev              # Start dev server with HMR
npm run build            # Build for production
npm run preview          # Preview production build
```

## 🎯 Next Steps

1. **API Routes**: Implement RESTful endpoints for all models
2. **Authentication**: Add JWT-based authentication middleware
3. **Frontend Forms**: Create forms for clients, services, and billing
4. **Dashboard**: Build analytics and reporting dashboard
5. **Payments**: Implement payment processing integration
6. **Testing**: Add unit and integration tests
7. **Deployment**: Setup deployment pipeline (Docker, CI/CD)

## 📞 Support

For issues or questions, refer to the service models and API structure documented in this README.

---

**Happy Accounting!** 📊✨
