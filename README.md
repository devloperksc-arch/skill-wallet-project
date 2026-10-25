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

## What Works (Chapters 1, 2 & 3)
- ✅ **Chapter 1 — Foundation, Authentication & Role-Based Shell**
  - JWT authentication (in-memory access token + httpOnly refresh cookie rotation)
  - Role-based authorization (`hr`, `manager`, `employee`)
  - Login, Logout, Refresh, Change Password endpoints
  - Responsive shell layout with desktop sidebar, mobile offcanvas drawer, and topbar user menu
  - 15 automated auth tests (100% pass)
- ✅ **Chapter 2 — Employee & Department Management**
  - Full Department CRUD with conflict detection and employee-check deletion protection
  - Workforce Employee directory with server pagination, sorting, and regex search
  - Manager-scoped team directory (isolated direct reports)
  - Public Colleague Directory accessible by all authenticated roles
  - HR employee creation with secure one-time temporary password generation & copy modal
  - Self-service personal profile editor (`PATCH /api/employees/me`) with strict schema validation
  - Employee status toggle (active/inactive) with session invalidation (`tokenVersion` increment)
  - Protection guards: HR cannot demote/deactivate self; cannot deactivate last HR administrator
  - 19 automated employee & department tests (100% pass)
- ✅ **Chapter 3 — Leave Management**
  - Leave Types CRUD with 409 deletion guard for active request records
  - Official Company Holidays management with duplicate date conflict detection
  - Working-day calculation service excluding weekends and holidays, with half-day single-day toggle
  - Live day preview endpoint (`GET /api/leaves/preview`) with holiday and weekend exclusion warnings
  - Complete leave request lifecycle: Apply, Approve, Reject (with required note), and Cancel
  - Concurrency race condition prevention: conditional atomic `findOneAndUpdate({ _id, status: 'pending' })` prevents double-approval
  - Role-based routing: employee with manager routes to manager; employee without manager or manager routes to HR pool
  - Self-approval protection: no user (including HR) can approve their own request; peer HR approval required
  - Strict calendar year boundary enforcement (no year-spanning leaves)
  - Annual leave balances tracking (allocated, used, pending, available) with HR quota adjustment guard
  - CSS Grid interactive Leave & Holiday Calendar with monthly navigation and role scoping
  - 22 automated leave management tests (100% pass, total 56 tests across suite)
- ✅ **Chapter 4 — Attendance & Announcements/News**
  - Attendance State Machine: Daily check-in and check-out tracking with server clock authority
  - Company Timezone Date Alignment: Timestamps converted to `YYYY-MM-DD` using company timezone (`Asia/Kolkata`)
  - Automated Late Detection: Evaluates arrival against `WORK_START + LATE_GRACE_MINUTES` (09:45)
  - Work Duration & Status Thresholds: >= 8h present, >= 4h half-day, otherwise absent with insufficient hours note
  - Leave Blocking: Prevents daily check-in if user has an approved leave on that date
  - Weekend / Non-working Day Flagging: Check-in permitted but marked as non-working day
  - Real-time Dashboard Clock Widget: Live sync clock, live elapsed timer, dynamic check-in/out buttons
  - My Attendance: Monthly calendar breakdown, derived day statuses, KPI counters (present, late, half-day, absent, leaves, total hours)
  - Manager Team Attendance: Daily team status overview with real-time quick filters (all, present, late, on leave, not checked in)
  - HR Attendance Management: Daily logs with pagination & filtering, monthly aggregation table, and Excel-safe CSV export (with formula-injection escaping for `= + - @`)
  - Attendance Corrections & Audit Trail: HR manual corrections and missing day creation with mandatory reason and history logs
  - Announcements Engine: Role-based audience filtering (`all`, `employee`, `manager`, `hr`), priority tags, and pin-to-top sorting
  - Scheduled & Expiring Announcements: Automated visibility filtering (`publishAt <= now` and `expiresAt > now`), HR manage table for scheduled/live/expired states
  - XSS-Safe Text Rendering: Script injection tags (`<script>`, `<iframe>`) safely displayed as harmless plain text
  - 15 automated attendance and announcement tests (100% pass, total 71 tests across suite)

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
