# StaffSync — Production MERN HRM System

StaffSync is an enterprise-grade Human Resource Management system built on the modern MERN stack (**MongoDB Community 8 / Atlas, Express 5, React 19, Node.js 24 LTS**) with Vanilla CSS / Bootstrap 5.3 and Vite 7.

---

## 🌟 Key Capabilities by Role

### 👔 HR Administration
- **Workforce Management**: Full Employee directory, department structuring, temporary password generation, employee onboarding, status toggling (active/deactivated) with immediate session revocation.
- **Leave Policy & Quotas**: Configure leave types, official company holidays, allocate annual quotas, adjust employee balances with mandatory audit notes, and act as the final approval authority for managerial leave requests.
- **Attendance Oversight**: Monitor real-time organization attendance, view per-employee monthly summaries, correct check-in/out records with an audit trail, and export Excel-safe CSV records (formula-injection protected).
- **Internal Communications**: Author, schedule, and pin company-wide announcements targeted to specific audience groups (`all`, `employee`, `manager`, `hr`) with XSS sanitization.
- **Executive Analytics**: Single-query dashboard with active headcount, department distribution bar chart, monthly leave status donut chart, 30-day attendance trend line, and training completion rates.

### 👥 People Managers
- **Team Oversight**: Scoped directory of direct reports with individual attendance and leave profiles.
- **Leave Approvals**: Review pending team leave requests with working-day preview (holidays/weekends deducted), approve or reject with comments, guarded against race conditions.
- **Attendance Tracking**: Real-time daily team attendance board with instant filters (Present, Late, On Leave, Not Checked In).
- **Training & Development**: Create training programs (online/in-person), track capacity meters, enroll direct reports, record scores, document manager notes, and mark completions.

### 💼 Employees
- **Self-Service Portal**: View and update allowed personal contact details, view reporting hierarchy.
- **Attendance Tracker**: Real-time clock widget synchronized with server time, one-click check-in/out, late arrival badges, and monthly personal attendance logs.
- **Leave Management**: Apply for leaves with automatic working-day calculator (excludes weekends/holidays), track annual quotas (allocated, used, pending, available), view team leave calendar, and cancel future approved requests.
- **Training & Skills**: View enrolled training programs, update progress percentage, log feedback, and view completion milestones.
- **Company Feed**: Read latest announcements with priority markers and pinned updates.

---

## 🏗️ Architecture & Technology Stack

```
staffsync/
├── Dockerfile                      # Production multi-stage Alpine build (non-root runner)
├── docker-compose.yml              # One-command execution with MongoDB 8
├── package.json                    # Workspace orchestration scripts (concurrently)
├── docs/
│   ├── DECISIONS.md                # Architectural decisions & invariants log
│   └── StaffSync.postman_collection.json # 35+ fully tested endpoints
├── server/                         # Express 5 (ESM) + Mongoose 9 Backend
│   ├── .env.example                # Documented configuration variables
│   ├── src/
│   │   ├── server.js               # Database connection and HTTP server listener
│   │   ├── app.js                  # Express 5 configuration & SPA static catch-all
│   │   ├── config/                 # Zod-validated environment config, DB connection
│   │   ├── models/                 # Mongoose schemas (User, Dept, Leave, Attendance, Training, Announcement)
│   │   ├── routes/                 # Express routers mounted under /api/*
│   │   ├── controllers/            # Controller layer
│   │   ├── services/               # Core business logic (dates, balances, rules, reports)
│   │   ├── middleware/             # auth, authorize, validate (zod), error, notFound
│   │   ├── validators/             # Strict Zod validation schemas
│   │   ├── utils/                  # ApiError, dates (company timezone), pagination
│   │   └── seed/                   # Idempotent database seeder
│   └── tests/                      # 121 automated tests (vitest, supertest, mongodb-memory-server)
└── client/                         # React 19 + React Router v8 + Bootstrap 5.3 + Vite 7
    ├── src/
    │   ├── api/                    # Axios API client modules with token auto-refresh
    │   ├── context/                # AuthContext (in-memory JWT) & ToastContext
    │   ├── layouts/                # AppLayout (Sidebar, Topbar, Alerts) & AuthLayout
    │   ├── components/             # Reusable UI widgets, Modals, Inline Accessible SVG Charts
    │   ├── pages/                  # Route-level code-split feature pages (dashboards, HR, leaves, attendance, training)
    │   └── styles/                 # Custom theme tokens and overrides
```

---

## ⚙️ Environment Configuration (`server/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |
| `PORT` | Backend HTTP port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/staffsync` |
| `JWT_ACCESS_SECRET` | Secret key for signing 15-minute access tokens (min 32 chars) | `change-me-to-a-very-secure-secret-key-32-chars!` |
| `JWT_REFRESH_SECRET` | Secret key for signing 7-day refresh tokens (min 32 chars) | `change-me-to-another-secure-secret-key-32-chars!` |
| `ACCESS_TOKEN_TTL` | Lifespan of access token | `15m` |
| `REFRESH_TOKEN_TTL` | Lifespan of refresh token | `7d` |
| `CLIENT_ORIGIN` | Allowed CORS origin + CSP `connect-src` (set to your public URL in production) | `http://localhost:5173` |
| `TRUST_PROXY` | Reverse-proxy hops to trust for client IP / rate limiting (`0` none, `1` behind one proxy) | `0` |
| `ALLOW_DEMO_SEED` | Production only: allow seeding demo accounts (**never on a real system**) | `false` |
| `COMPANY_TZ` | Authoritative organization timezone | `Asia/Kolkata` |
| `WORK_START` | Official start of workday | `09:30` |
| `LATE_GRACE_MINUTES` | Grace window before marking attendance as late | `15` |
| `FULL_DAY_MINUTES` | Minimum worked minutes required for full-day present | `480` |
| `HALF_DAY_MINUTES` | Minimum worked minutes required for half-day status | `240` |
| `WEEKEND_DAYS` | Comma-separated weekend day indexes (0=Sun, 6=Sat) | `0,6` |
| `LEAVE_BACKDATE_DAYS`| Allowed backdating window for leave applications | `7` |
| `SEED_PASSWORD` | Password assigned to seeded demo accounts (development/demo only) | `Passw0rd!23` |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: `24 LTS` (minimum `22.22+`)
- **MongoDB**: `8.x` running locally (`mongod`) or MongoDB Atlas connection string
- **npm**: Ships with Node.js

### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/devloperksc-arch/skill-wallet-project.git
cd skill-wallet-project

# Install root, backend, and frontend dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Setup environment variables
cp server/.env.example server/.env

# (Optional) seed demo departments, users, leave types and holidays into a running MongoDB.
# In development the server auto-starts an embedded MongoDB and auto-seeds if none is running.
npm run seed

# Run both backend and frontend concurrently
npm run dev
```

- **Frontend Client**: `http://localhost:5173` (proxies `/api` requests to backend)
- **Backend API**: `http://localhost:5000`

---

## 🐳 Docker Deployment (One-Command Run)

Run the full production stack (Node.js 24 Alpine runner + MongoDB 8 + persistent storage) with Docker Compose:

```bash
# 1. Create your secrets file (never commit it)
cp .env.docker.example .env
#    then edit .env: set MONGO_PASSWORD and generate JWT secrets with `openssl rand -hex 48`

# 2. Build and run containers in background
docker compose up -d --build

# Inspect running services
docker compose ps

# Access the application
# Frontend & API are served simultaneously on http://localhost:5000
```

MongoDB is **not** published to the host; it is only reachable by the app container and requires authentication.
The production container starts with an empty database and refuses to load demo accounts. Create the first HR admin
with a one-off script/`mongosh` insert, or — for a throw-away demo only — set `ALLOW_DEMO_SEED=true` and run
`docker compose exec app node server/src/seed/seed.js`.

---

## 🔑 Demo Test Accounts (development / demo only)

The seed script creates 19 accounts that all share the password in `SEED_PASSWORD` (default **`Passw0rd!23`**).
The login screen's one-click demo buttons appear **only in development builds** (`npm run dev`), never in production.

| Role | Email | Name | Department |
|---|---|---|---|
| **HR Admin** | `hr@staffsync.test` | Alice HR | Human Resources |
| **HR Admin** | `hr2@staffsync.test` | Bob HR | Human Resources |
| **Manager** | `manager@staffsync.test` | Carol Manager | Engineering |
| **Employee** | `employee1@staffsync.test` | Dave Employee | Engineering |
| **Employee** | `employee2@staffsync.test` | Eve Employee | Engineering |
| **Employee** | `employee3@staffsync.test` | Frank Employee | Sales (no manager → HR approves) |

---|---|---|---|---|
| **HR Admin** | `hr@staffsync.test` | Sarah Jenkins | Chief HR Officer | Human Resources |
| **HR Specialist** | `hr2@staffsync.test` | David Miller | HR Operations Lead | Human Resources |
| **Manager** | `manager@staffsync.test` | Marcus Chen | Engineering Manager | Engineering |
| **Employee** | `employee1@staffsync.test` | Priya Sharma | Senior Full Stack Engineer | Engineering |
| **Employee** | `employee2@staffsync.test` | Alex Rivera | DevOps Engineer | Engineering |
| **Employee** | `employee3@staffsync.test` | Emma Watson | UI/UX Designer | Product Design |

---

## 🧪 Automated Testing Suite

The application is backed by comprehensive integration and unit tests using **Vitest**, **Supertest**, and **mongodb-memory-server** (no external DB required during tests).

```bash
# Run all automated test suites
npm test

# Run tests with coverage
cd server && npx vitest run --coverage
```

### Test suites (121 server tests + 3 client tests)
- `auth.test.js` (15): login, JWT refresh rotation, password change, rate limiting.
- `employees.test.js` (19): departments, employees, manager scoping, self-profile, deactivation guards.
- `leaves.test.js` (22): policies, working-day calculation, double-approval guard, balances, calendar.
- `attendance.test.js` (15): check-in/out state machine, late calculation, timezone rollover, CSV formula escaping, announcements.
- `training.test.js` (15): lifecycle, capacity, direct-report scoping, progress, dashboard payloads.
- `acceptance.e2e.test.js` (6): full-system scenario.
- `regression.audit.test.js` (29): locks in every bug fixed during the security/quality audit (see `docs/AUDIT_REPORT.md`).
- `client/src/__tests__` (3): forced-password-change page renders, form labels wired to inputs.

Tests need no `.env` file (the test environment supplies throw-away secrets); CI runs them on every push (`.github/workflows/ci.yml`).

---

## 📡 API Reference Overview

The API is fully documented and exportable via [`docs/StaffSync.postman_collection.json`](docs/StaffSync.postman_collection.json).

| Category | Method | Path | Access |
|---|---|---|---|
| **Health** | `GET` | `/api/health` | Public |
| **Auth** | `POST` | `/api/auth/login` | Public |
| | `POST` | `/api/auth/refresh` | Cookie |
| | `GET` | `/api/auth/me` | Authenticated |
| | `POST` | `/api/auth/change-password` | Authenticated |
| | `POST` | `/api/auth/logout` | Authenticated |
| **Departments** | `GET` | `/api/departments` | Authenticated |
| | `POST` / `PUT` / `DELETE` | `/api/departments/:id` | HR Only |
| **Employees** | `GET` | `/api/employees` | HR, Manager (scoped) |
| | `GET` | `/api/employees/directory` | Authenticated |
| | `GET` | `/api/employees/team` | Manager Only |
| | `POST` | `/api/employees` | HR Only |
| | `PATCH` | `/api/employees/me` | Authenticated (self) |
| | `PATCH` | `/api/employees/:id/status` | HR Only |
| | `POST` | `/api/employees/:id/reset-password` | HR Only |
| **Leave types** | `GET` | `/api/leave-types` | Authenticated |
| | `POST` / `PUT` / `DELETE` | `/api/leave-types[/:id]` | HR Only |
| **Holidays** | `GET` | `/api/holidays` | Authenticated |
| | `POST` / `PUT` / `DELETE` | `/api/holidays[/:id]` | HR Only |
| **Leaves** | `GET` | `/api/leaves/preview` | Authenticated |
| | `POST` | `/api/leaves` | Authenticated (apply) |
| | `GET` | `/api/leaves/my` · `/api/leaves/calendar` · `/api/leaves/:id` | Authenticated (scoped) |
| | `GET` | `/api/leaves` · `/api/leaves/pending-approvals` | Manager / HR |
| | `PATCH` | `/api/leaves/:id/decision` | Manager / HR |
| | `PATCH` | `/api/leaves/:id/cancel` | Owner |
| | `GET` / `PATCH` | `/api/leaves/balances[/:userId or :id]` | Authenticated / HR (adjust) |
| **Attendance** | `POST` | `/api/attendance/check-in` | Authenticated |
| | `POST` | `/api/attendance/check-out` | Authenticated |
| | `GET` | `/api/attendance/today` | Authenticated |
| | `GET` | `/api/attendance/my` | Authenticated |
| | `GET` | `/api/attendance/team` | Manager Only |
| | `GET` | `/api/attendance` · `/api/attendance/summary` | HR Only |
| | `PUT` | `/api/attendance/:id` | HR Only (correction) |
| | `GET` | `/api/attendance/export.csv` | HR Only |
| | `POST` | `/api/attendance/correct` | HR Only |
| **Announcements**| `GET` | `/api/announcements` | Authenticated (filtered) |
| | `GET` | `/api/announcements/manage` | HR Only |
| | `POST` / `PUT` / `DELETE` | `/api/announcements/:id` | HR Only |
| | `PATCH` | `/api/announcements/:id/pin` | HR Only |
| **Training** | `GET` | `/api/training` | Authenticated (scoped) |
| | `POST` / `PUT` / `DELETE` | `/api/training/:id` | Manager Only |
| | `PATCH` | `/api/training/:id/status` | Manager Only |
| | `POST` | `/api/training/:id/enroll` | Manager Only |
| | `DELETE` | `/api/training/:id/enroll/:userId` | Manager Only |
| | `GET` | `/api/training/my` | Authenticated |
| | `PATCH` | `/api/training/enrollments/:id` | Authenticated |
| | `GET` | `/api/training/reports/summary` | Manager / HR |
| **Dashboard** | `GET` | `/api/dashboard` | Authenticated (role tailored) |

---

## 🌐 Production Single-Service Deployment Guide

StaffSync is architected to deploy easily to container platforms such as **Render**, **Railway**, or **Fly.io** paired with a **MongoDB Atlas** cluster.

1. **Build Step**: Express serves the compiled React client (`client/dist`) via static middleware and Express 5 splat routing `app.get('/{*splat}', ...)` returning `index.html`.
2. **Reverse Proxy Trust**: set `TRUST_PROXY=1` when running behind one proxy (Render, Fly, nginx, Cloudflare) so rate limiting sees real client IPs. Leave `0` when directly exposed.
3. **Environment Setup**:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/staffsync?retryWrites=true&w=majority`
   - `JWT_ACCESS_SECRET=<generated 64-character random string>`
   - `JWT_REFRESH_SECRET=<generated 64-character random string>`
   - `CLIENT_ORIGIN=https://staffsync.yourdomain.com`
   - `TRUST_PROXY=1`
4. **First admin**: the seeder refuses to run in production (it creates 19 accounts sharing one password).
   Insert a single HR user yourself (hash the password with bcrypt cost 12, set `mustChangePassword: true`), then create everyone else from the UI.

---

## 🛡️ Security & Hardening Highlights
- **Sessions**: access tokens live only in JS memory (15 min); refresh tokens are `httpOnly`, `SameSite=Lax`, `Secure` (production) cookies. Changing/resetting a password or deactivating an account bumps `tokenVersion`, which **immediately revokes both access and refresh tokens**.
- **Forced password change** is enforced by the API (HTTP 403 until the temporary password is replaced), not only by the UI.
- **Concurrency**: leave approval/cancellation use conditional atomic updates; applying for leave reserves balance atomically under a short per-user lock, with rollback on failure.
- **Input validation**: Zod schemas validate every body; controllers use the validated payload (never raw `req.body`); dates must be real calendar dates; ranges and years are bounded; search/sort parameters are whitelisted/escaped.
- **Privacy**: the team calendar never exposes colleagues' leave reasons, decision notes or leave category.
- **Rate limiting**: 300 requests / 15 min / IP globally; 10 *failed* logins / 15 min / IP (successful logins don't count).
- **Transport/headers**: Helmet with a strict CSP. Note: CSP includes `upgrade-insecure-requests`; serve production over HTTPS (or access via `localhost`).
- **Output**: React escapes all rendered text; there are no `dangerouslySetInnerHTML` sinks. CSV exports neutralise spreadsheet formula injection.
- **Containers**: non-root user, no secrets in the image or repo, MongoDB not exposed and authenticated.

Known limitations are tracked in `docs/AUDIT_REPORT.md`.

---

## 📄 License
ISC © StaffSync Team
