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

## 💻 Run locally (for testers / UAT)

Share this section with anyone who should try the app on their own machine. They use **their** MongoDB (e.g. a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster); demo data is optional via the seed script.

### Requirements

- **Node.js** v18 or newer ([nodejs.org](https://nodejs.org))
- **npm** (comes with Node)
- **MongoDB** — local install or Atlas connection string

### Steps

1. **Clone the repo** (use the Git URL your team shares, e.g. from GitHub), then enter the project folder:
   ```bash
   git clone <REPOSITORY_URL>
   cd CA-Client-Tracker
   ```
   If the folder name differs after clone, `cd` into that folder instead.

2. **Install dependencies** (from the project root — the folder that contains `client/`, `server/`, and this `README.md`):
   ```bash
   npm run install:all
   ```

3. **Backend environment** — copy the example env file and edit it:
   ```bash
   cd server
   copy .env.example .env
   ```
   On macOS/Linux use `cp .env.example .env` instead of `copy`.

   In `server/.env`, set at least:
   - **`MONGODB_URI`** — your MongoDB connection string (Atlas: *Connect → Drivers*).
   - **`JWT_SECRET`** — any long random string (32+ characters).

   For local testing you can leave **`NODE_ENV=development`** and keep **`DEV_ALLOW_ANY_LOGIN=true`** (see `.env.example`) so sign-in is easier while you iterate.

4. **Frontend environment** — open the `client` folder (from `server/`, run `cd ../client`). Create **`client/.env`** so the UI talks to your **local** API (not the hosted production API). The file must contain exactly:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
   Easiest: open `client/.env` in any text editor, paste that line, save.  
   From a shell in the `client` folder you can use:
   - **macOS / Linux:** `printf 'VITE_API_URL=http://localhost:5000\n' > .env`
   - **Windows (PowerShell):** `Set-Content .env 'VITE_API_URL=http://localhost:5000'`

5. **Seed demo data (recommended, once)** — from the **project root** (the folder that contains `client` and `server`):
   ```bash
   cd server
   npm run seed
   cd ..
   ```
   If you are still inside `client/`, use `cd ../server` instead of `cd server`.
   This creates sample clients, billing, payments, and a demo user. Seeding **clears** existing data in that database — use a dedicated database for testing.

6. **Start the app** — from the **project root**:
   ```bash
   npm run dev
   ```
   Wait until the terminal shows both the API and Vite ready.

7. **Open the app** in a browser: **http://localhost:5173**

8. **Sign in** (after a successful seed):
   - **Email:** `demo@ca.com`
   - **Password:** `CaTracker_Demo_2026!`

### Quick checks if something fails

| Issue | What to try |
|--------|-------------|
| `Cannot connect to MongoDB` | Confirm `MONGODB_URI` in `server/.env`; in Atlas, allow your IP (or `0.0.0.0/0` for testing only) under *Network Access*. |
| Login always fails | Run `npm run seed` in `server/` again; confirm the demo user exists. If `DEV_ALLOW_ANY_LOGIN=false`, use the seeded password above. |
| UI calls the wrong API / CORS errors | Ensure `client/.env` exists with `VITE_API_URL=http://localhost:5000`, then restart `npm run dev`. |
| Port 5000 already in use | Set `PORT=5001` (or another port) in `server/.env` and set `VITE_API_URL=http://localhost:5001` in `client/.env`, then restart. |

---

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
   cd CA-Client-Tracker
   ```
   (Use your actual clone folder name if different.)

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

The frontend uses **`VITE_API_URL`** (see `client/src/lib/api.js`). There is **no** baked-in Render URL in the repo: you must set the real API origin yourself.

- **Local:** `VITE_API_URL=http://localhost:5000` in **`client/.env`** (see *Run locally* above).
- **Vercel (production):** Project → **Settings → Environment Variables** → add **`VITE_API_URL`** = your Render web service HTTPS URL (example shape: `https://your-service-name.onrender.com`, no trailing slash, no `/api` suffix). Redeploy after saving.

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
