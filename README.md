# CA Client Tracker

Practice management and billing for Chartered Accountants—clients, recurring services, billing periods, collections, and reports in one MERN stack app.

---

## 1. Project overview

**What it does**

The app supports a CA firm’s daily operations: maintain a client directory and service catalog with custom pricing, generate billing periods automatically, visualize the financial year in a client × month matrix, record payments with FIFO allocation to open invoices, and import clients in bulk from CSV or Excel. Dashboard KPIs, PDF statements, aging views, dark mode, and a responsive layout cover both desk review and lighter mobile use.

**Tech stack (MERN)**

| Layer | Technology |
| ----- | ----------- |
| **M**ongoDB | Atlas or self-hosted; Mongoose models |
| **E**xpress | REST API, JWT cookies, rate limiting |
| **R**eact | Vite, React Router, Axios, Tailwind-style UI |
| **N**ode.js | ES modules (`"type": "module"`), `server.js` entry |

---

## 2. Live demo

| Resource | URL |
| -------- | --- |
| **Frontend** | [https://ca-client-tracker.vercel.app](https://ca-client-tracker.vercel.app) |
| **Backend API** | [https://ca-client-tracker-1.onrender.com](https://ca-client-tracker-1.onrender.com) |

**Demo login**

- **Email:** `demo@ca.com`  
- **Password:** `CaTracker_Demo_2026!`

---

## 3. Local setup

### Prerequisites

- **Node.js** [LTS](https://nodejs.org) (includes `npm`)
- **Git**

### Clone and install

```bash
git clone https://github.com/janvika11/CA-Client-Tracker
cd CA-Client-Tracker
npm install
cd client && npm install
cd ../server && npm install
```

### Environment files

Create **`server/.env`**:

```env
MONGODB_URI=your_atlas_connection_string
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=development
```

Optional for local easing (see `server/.env.example`): copy from `.env.example` and adjust `DEV_ALLOW_ANY_LOGIN`, `CORS_ORIGIN`, etc.

Create **`client/.env`**:

```env
VITE_API_URL=http://localhost:5000
```

### Seed data

```bash
cd server && npm run seed
```

Clears existing data in that database—use a dedicated DB for testing.

### Run the app

**Terminal 1 — API**

```bash
cd server && npm run dev
```

**Terminal 2 — UI**

```bash
cd client && npm run dev
```

Open **http://localhost:5173** and sign in with the seeded demo user (`demo@ca.com` / `CaTracker_Demo_2026!`).

**Tip:** From the repo root you can alternatively run `npm run install:all` once and `npm run dev` to start both processes with [concurrently](https://www.npmjs.com/package/concurrently).

### Quick troubleshooting

| Issue | What to check |
| ----- | ------------- |
| MongoDB errors | `MONGODB_URI`, Atlas Network Access (`0.0.0.0/0` for testing), correct password in URI |
| Login fails | Re-run seed; production-like setups need `DEV_ALLOW_ANY_LOGIN=false` and real passwords |
| Wrong API / CORS | `client/.env` has `VITE_API_URL`; restart dev servers after changes |
| Port in use | Change `PORT` in `server/.env` and mirror in `VITE_API_URL` |

---

## 4. Deployment

### Frontend — Vercel

Create a project from this Git repo and configure:

| Setting | Value |
| ------- | ----- |
| **Root Directory** | `client` |
| **Framework** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Environment variable** | `VITE_API_URL` = `https://your-render-url.onrender.com` (no trailing slash) |

Redeploy after changing env vars.

### Backend — Render

Create a Web Service from the same repo:

| Setting | Value |
| ------- | ----- |
| **Root Directory** | `server` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |

**Environment variables**

| Variable | Example / notes |
| -------- | ---------------- |
| `MONGODB_URI` | Atlas SRV connection string |
| `JWT_SECRET` | Long random secret (32+ chars) |
| `NODE_ENV` | `production` |
| `PORT` | `5000` (or the port Render assigns; align CORS/front-end if changed) |
| `TRUST_PROXY` | `true` (recommended behind Render’s proxy) |
| `CORS_ORIGIN` | Your Vercel URL, e.g. `https://ca-client-tracker.vercel.app` |

The server also allows `*.vercel.app` and common localhost dev origins (see `server/server.js`). Set `CORS_ORIGIN` for any extra production origin.

### Database — MongoDB Atlas

1. Create a **free cluster** at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Under **Network Access**, allow **`0.0.0.0/0`** (or restrict to Render egress IPs later for tighter security).
3. Create a database user and copy the **connection string** into `MONGODB_URI` on Render (and locally).

---

## 5. Seed data

```bash
cd server && npm run seed
```

**Creates**

- **1** demo user (`demo@ca.com`)
- **8** services  
- **15** clients  
- **413** billing entries  
- **290** payment records (target; exact count can differ slightly each run because invoice statuses in `seed.js` use `Math.random()`)

---

## 6. Features

### P0 — Core

- Client directory with CRUD  
- Service catalog with custom pricing  
- Auto billing period generation  
- FY matrix view (client × month)  
- Payment recording with FIFO allocation  
- Bulk upload via CSV / Excel  

### P1 — Enhanced

- Dashboard with KPIs and charts  
- Outstanding statement PDF  
- Aging reports  
- Dark mode and mobile-responsive layout  

---

## Repository layout (summary)

```
CA-Client-Tracker/
├── client/          # Vite + React SPA
├── server/          # Express API (server.js, models, routes, seed.js)
├── package.json     # Root scripts (optional concurrent dev / full build)
└── README.md
```

## Useful scripts

```bash
# Root
npm run dev              # client + server (after install:all)
npm run install:all      # root + server + client dependencies
npm run build            # server placeholder build + client production build

# Server
cd server && npm run dev    # Node --watch server.js
cd server && npm run seed   # Seed database

# Client
cd client && npm run dev    # Vite dev server
cd client && npm run build  # Production bundle
```

---

## Security notes

Passwords use bcrypt; GSTIN/PAN validation on clients; keep `JWT_SECRET` and `MONGODB_URI` out of version control (`server/.env` is gitignored). Use HTTPS in production (Vercel + Render).

---

For API surface and models, inspect `server/routes/` and `server/models/`. Happy accounting.
