# StaffSync — MERN HRM System

A web-based Human Resource Management system built on the MERN stack (MongoDB, Express 5, React 19, Node 24 LTS).

## Roles
- **HR** — manages employees, departments, leave settings, attendance, announcements
- **Manager** — approves team leaves, manages training programs
- **Employee** — marks attendance, applies for leave, views assigned trainings

## Quick Start

### Prerequisites
- Node.js 24 LTS (≥ 22.22)
- MongoDB running locally (`mongod`) or an Atlas URI
- npm (ships with Node 24)

### Setup

```bash
# 1. Install root dependencies
npm install

# 2. Install server dependencies
cd server && npm install && cd ..

# 3. Scaffold Vite client (done once)
cd client && npm install && cd ..

# 4. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and secrets

# 5. Seed the database
npm run seed

# 6. Start dev servers
npm run dev
```

- API: http://localhost:5000
- Client: http://localhost:5173

## Test Accounts (dev only — password: `Passw0rd!23`)

| Email | Role |
|-------|------|
| hr@staffsync.test | HR |
| hr2@staffsync.test | HR |
| manager@staffsync.test | Manager |
| employee1@staffsync.test | Employee |
| employee2@staffsync.test | Employee |
| employee3@staffsync.test | Employee |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both server and client in dev mode |
| `npm run seed` | Seed the database (idempotent) |
| `npm test` | Run all server tests |
| `npm run build` | Build the client for production |
| `npm start` | Start the production server |

## What Works (Chapter 1)
- ✅ Full-stack project scaffold (MERN)
- ✅ JWT authentication (access + refresh tokens)
- ✅ Role-based authorization (HR / Manager / Employee)
- ✅ Login, Logout, Refresh, Change Password endpoints
- ✅ Role-specific dashboard shells with sidebar navigation
- ✅ Seed script with 6 test users across 4 departments
- ✅ Automated tests (auth suite)

## API
See `docs/StaffSync.postman_collection.json` for the Postman collection.

## Architecture
```
staffsync/
├─ server/          # Express 5 + Mongoose 9 backend
│  └─ src/
│     ├─ config/    # env, db, constants
│     ├─ models/    # Mongoose models
│     ├─ routes/    # Express routers
│     ├─ controllers/
│     ├─ services/  # business logic
│     ├─ middleware/ # auth, authorize, validate, error
│     ├─ validators/ # Zod schemas
│     ├─ utils/     # ApiError, dates, pagination
│     └─ seed/      # idempotent seed script
└─ client/          # React 19 + Vite + Bootstrap 5.3
   └─ src/
      ├─ api/       # axios instance per resource
      ├─ context/   # AuthContext, ToastContext
      ├─ layouts/   # AppLayout, AuthLayout
      ├─ components/ # shared UI components
      └─ pages/     # feature pages
```
