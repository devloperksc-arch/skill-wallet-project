<!-- PAGE 1 -->
StaffSync — Agent Build Plan (MERN HRM System)
Audience: an AI coding agent (Claude Code, Cursor, etc.) that will build this project from
an empty folder. Format: 5 chapters. Each chapter ends with a runnable, independently
testable application. Rule #1: Build ONE chapter at a time. Do not start Chapter N+1 until
Chapter N's Deﬁnition of Done is fully ticked.
0. How the agent must use this ﬁle
1. Read Sections 1–6 completely once (they are the shared rules). Then read only the
chapter you were asked to build.
2. When told "Build Chapter N", do exactly that chapter. Do not add features from later
chapters, but do not break earlier ones.
3. At the end of each chapter:
Run the chapter's Acceptance Tests and show the results.
Run npm test in server/ (all green) and npm run build in client/ (no errors).
Update docs/StaffSync.postman_collection.json with every new endpoint.
Update README.md (what works now, how to run, test accounts).
Commit with message chapter-N: <summary> and tag chapter-N.
4. If something in this ﬁle conﬂicts with what you observe (a package changed, an API
differs), trust the installed package's official docs, make the smallest correct
adjustment, and note it in docs/DECISIONS.md.
5. Never invent features that are not listed. If a requirement is ambiguous, pick the simplest
option that satisﬁes the roles/permissions matrix in Section 5 and record the choice in
docs/DECISIONS.md.
6. Never commit secrets. .env is git-ignored; .env.example is committed.
Kickoff prompt the user can paste for each chapter:
Read STAFFSYNC_BUILD_PLAN.md Sections 1–6 and then build Chapter N only. Follow its
Deﬁnition of Done, run its acceptance tests, then stop and report.
1. Project brief (cleaned up)
StaffSync is a web-based Human Resource Management system built on the MERN stack. It
digitizes core HR processes for an organization, with three roles:

<!-- PAGE 2 -->
Role What they do
HR Manage employee data and departments, conﬁgure leave types and holidays, approve leaves
(ﬁnal authority), monitor/correct attendance, publish announcements and news, view
company-wide dashboards and reports
Manager Approve/reject leave requests of their direct reports, view team attendance, create and
manage training & development programs and enroll team members
Employee Maintain personal record, apply/cancel leave and see balances, mark attendance (check-
in/out), read announcements, see assigned trainings
Note on the original brief: the system-requirements text mentions "farms" and an
"agricultural platform". That is a copy-paste leftover. This project is only an HR system. Ignore
any agriculture wording.
Explicitly out of scope (do not build): payroll/salary processing, recruitment/ATS, email
sending, biometric/geo-fencing attendance, ﬁle uploads/avatars, multi-tenant/multi-company,
mobile app, i18n.
2. Research ﬁndings — technology decisions
Versions were veriﬁed against official sources in October 2026. Always install with 
 npm
install <pkg>@latest unless a ﬂoor is listed, then record the resolved versions in
docs/DECISIONS.md.
2.1 Runtime & tooling
Item Decision Why
Node.js 24 LTS (Active LTS). Minimum
22.22+. Node 26 enters LTS on 28 Oct
2026 and is also ﬁne.
The original brief says "v16+", but Node 16 is long
past end-of-life. React Router v8 requires Node
22.22+, Express 5 requires Node 18+.
npm Whatever ships with Node 24 (npm
10/11).
Brief says v8+; newer is ﬁne.
MongoDB Community Server 8.x locally, or
MongoDB Atlas free tier.
Current supported major line.
Editor / API
tester
VS Code, Postman (keep a collection
in docs/).
As speciﬁed in brief.

<!-- PAGE 3 -->
2.2 Backend stack (ESM, "type": "module")
Package Purpose Notes
express@5 HTTP API Express 5 is the default
latest on npm.
mongoose@9 ODM Mongoose 9 is the current
major (released Nov 2025).
jsonwebtoken JWT Access + refresh tokens.
bcryptjs Password
hashing
Pure JS, no native build
problems on Windows. Cost
factor 12.
zod Request
validation
One schema per route.
helmet, cors, express-rate-limit, 
cookie-
parser, morgan, dotenv
Security &
plumbing
dayjs (+ utc, timezone, isoWeek plugins) Date handling See 3.4 on date strategy.
Dev/test: vitest, supertest, 
 mongodb-
memory-server, nodemon (or node --watch),
eslint
Tests never touch the dev
database.
Express 5 gotchas the agent must respect
Rejected promises/async errors in route handlers are forwarded to the error handler
automatically — do not wrap handlers in try/catch just to call next(err).
Wildcard routes need a named splat: use '/{*splat}', not '*' or '/*'.
req.query is a read-only getter — never assign to it. Put parsed/validated input on
req.validated.
express.urlencoded defaults extended to false. We use JSON only, so this rarely
matters.
Mongoose 9 gotchas
No callbacks anywhere; use async/await.

<!-- PAGE 4 -->
Write middleware hooks as async functions and do not use next() in pre hooks
(removed in v9). If unsure, consult the Mongoose 9 migration guide.
Connect beforeapp.listen() and fail fast if the connection fails (otherwise requests
hang while Mongoose buffers commands).
Do not use multi-document transactions (they require a replica set, and a plain local
mongod is standalone). Use conditional atomic updates instead (findOneAndUpdate
with a status/balance condition). See Chapter 3.
2.3 Frontend stack
Package Purpose Notes
react@19 + 
 react-
dom@19
UI Must be ≥ 19.2.7 if you use React Router v8.
vite (latest, ≥ 7) +
@vitejs/plugin-react
Dev
server/build
Scaffold with 
 npm create vite@latest client --
--template react. Plain JavaScript (not TypeScript) —
the brief lists JavaScript.
react-router (v8) Routing Import from react-router, never 
 react-router-
dom (the -dom package was removed in v8).
RouterProvider (if used) comes from 
 react-
router/dom. We use declarative <BrowserRouter>
from react-router.
bootstrap@5.3 +
react-bootstrap@2 +
bootstrap-icons
UI
framework
Import only the Bootstrap CSS; react-bootstrap supplies JS
behavior. Do not also import bootstrap.bundle.js.
axios HTTP client One conﬁgured instance with interceptors.
dayjs Dates
react-hook-form Forms Optional but recommended for the larger forms.
State management: React Context + hooks only (AuthContext, ToastContext). No Redux.

<!-- PAGE 5 -->
2.4 Authentication design (JWT)
Token Lifetime Storage Purpose
Access
token
(JWT)
15 min In memory (React state/axios default
header). Never localStorage.
Sent as 
Authorization: Bearer
…
Refresh
token
(JWT)
7 days httpOnly, SameSite=Lax,
Secure in production cookie, path
/api/auth
Obtains a new access token via
POST /api/auth/refresh
Refresh tokens carry a tv (tokenVersion) claim. User.tokenVersion is incremented on
password change, password reset and deactivation → all existing refresh tokens die
immediately.
There is no public sign-up. Accounts are created by HR (with a temporary password and
mustChangePassword = true). The very ﬁrst HR account comes from the seed script.
In development, the Vite dev server proxies /api to the backend so cookies are same-
origin (no CORS headaches). In production, Express serves client/dist, so it is also
same-origin.

<!-- PAGE 6 -->
3. Architecture & conventions
3.1 Repository layout
staffsync/
├ ─ package.json                # root scripts only (concurrently)
├ ─ README.md
├ ─ .gitignore
├ ─ docs/
│  ├ ─ DECISIONS.md             # resolved versions + any deviation from this
plan
│  └─ StaffSync.postman_collection.json
├ ─ server/
│  ├ ─ package.json
│  ├ ─ .env.example
│  ├ ─ src/
│  │  ├ ─ server.js             # connect DB, then listen
│  │  ├ ─ app.js                # builds the Express app (exported for tests)
│  │  ├ ─ config/               # env.js (validated with zod), db.js,
constants.js
│  │  ├ ─ models/               # *.model.js
│  │  ├ ─ routes/               # *.routes.js (one per resource)
│  │  ├ ─ controllers/          # *.controller.js
│  │  ├ ─ services/             # business logic (leave calc, attendance rules…)
│  │  ├ ─ middleware/           # auth.js, authorize.js, validate.js, error.js,
notFound.js
│  │  ├ ─ validators/           # zod schemas
│  │  ├ ─ utils/                # ApiError.js, dates.js, pagination.js,
asyncHelpers
│  │  └─ seed/                 # seed.js (idempotent)
│  └─ tests/                   # *.test.js (vitest + supertest)
└─ client/
├ ─ package.json
├ ─ vite.config.js           # proxy /api -> http://localhost:5000
└─ src/
├ ─ main.jsx, App.jsx
├ ─ api/                  # axios instance + one file per resource
├ ─ context/              # AuthContext, ToastContext
├ ─ hooks/
├ ─ routes/               # ProtectedRoute, RoleRoute, route table
├ ─ layouts/              # AppLayout (sidebar+topbar), AuthLayout
├ ─ components/           # DataTable, StatCard, StatusBadge, ConfirmModal,

<!-- PAGE 7 -->
Root package.json scripts: dev (runs server + client with concurrently), seed, test,
build, start. All scripts must work on Windows, macOS and Linux (no export VAR=…
shell syntax).
3.2 Environment variables (server/.env.example)
config/env.js validates these with zod and crashes at startup with a clear message if a
required one is missing or a secret is shorter than 32 chars (in production).
3.3 API conventions
Base path /api. JSON only. Resource names plural, kebab-case.
Success:
 { "success": true, "data": <payload>, "meta": { "page", "limit",
"total", "totalPages" } } (meta only on lists).
Error:
 { "success": false, "message": "Human readable", "errors": [{ "field":
"email", "message": "…" }] } (errors only for validation).
Status codes: 200 OK, 201 created, 204 no content, 400 validation/business-rule
failure, 401 not authenticated / token expired, 403 authenticated but not allowed, 404
not found, 409 conﬂict (duplicate, already checked in…), 429 rate limited, 500
unexpected.
PageHeader, EmptyState, Spinner, FormField
├ ─ pages/<feature>/      # one folder per feature
└─ styles/               # theme.css (design tokens), overrides
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/staffsync
JWT_ACCESS_SECRET=change-me-min-32-chars
JWT_REFRESH_SECRET=change-me-different-min-32-chars
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
CLIENT_ORIGIN=http://localhost:5173
COMPANY_TZ=Asia/Kolkata
WORK_START=09:30
LATE_GRACE_MINUTES=15
FULL_DAY_MINUTES=480
HALF_DAY_MINUTES=240
WEEKEND_DAYS=0,6              # 0=Sunday … 6=Saturday
LEAVE_BACKDATE_DAYS=7
SEED_PASSWORD=Passw0rd!23     # dev only

<!-- PAGE 8 -->
Pagination: ?page=1&limit=10 (limit max 100). Search: ?q=. Sort: ?sort=-createdAt.
Every route is wrapped by authenticate (except login/refresh/health), then
authorize(...roles), then validate(zodSchema).
A central error.js middleware maps: ApiError → its status; ZodError → 400 with
ﬁeld errors; Mongoose ValidationError → 400; Mongo duplicate key 11000 → 409;
CastError/invalid ObjectId → 400; JsonWebTokenError/TokenExpiredError → 401;
everything else → 500 (message hidden in production, stack only in development).
Never return passwordHash. It is select: false in the schema.
3.4 Date & time strategy (avoid the #1 source of HR-app bugs)
Leave dates, holidays and attendance days are stored as date keys: strings 
 "YYYY-MM-
DD" in the company timezone (COMPANY_TZ). They are never converted through
JavaScript Date for comparison.
Timestamps (checkIn, checkOut, createdAt, decidedAt) are real Date values (UTC
in DB).
utils/dates.js exports: todayKey(), toDateKey(date), eachDateKey(start, end),
isWeekend(key), countWorkingDays(startKey, endKey, holidayKeys),
minutesBetween(a, b), localTimeOf(date). Unit-test it.
The server clock is the only clock: attendance check-in time is never taken from the
client.
3.5 Code quality rules
ESLint passes with zero errors. Small functions. Business rules live in services/, not
controllers.
No console.log in committed code except the startup banner; use morgan for request
logs.
Every list endpoint is paginated. Every query on a large collection has a supporting
index.
Every write endpoint validates input with zod and rejects unknown ﬁelds (.strict()).
4. Data model (all chapters at a glance)
Build only the models belonging to the current chapter; this is the full picture so relations are
consistent.

<!-- PAGE 9 -->
Department 1───* User *───1 User(manager)
User 1───* LeaveBalance *───1 LeaveType
User 1───* LeaveRequest *───1 LeaveType
User 1───* Attendance
User 1───* Announcement (createdBy)
TrainingProgram 1───* TrainingEnrollment *───1 User
Holiday (standalone)

<!-- PAGE 10 -->
Model Key ﬁelds Indexes / constraints
User employeeCode (auto EMP-0001), name,
email (lowercase), passwordHash (select:false),
role (hr|manager|employee),
department (ref), designation, manager (ref
User, nullable), dateOfJoining, status
(active|inactive), phone, dob, gender,
address, 
emergencyContact {name,
relation, phone}, mustChangePassword,
tokenVersion, lastLoginAt, timestamps
unique email, unique
employeeCode; index
{manager},
{department,
status}; text index on
name, email,
employeeCode
Department name, code, description, head (ref User,
optional)
unique name, unique
code
LeaveType name, code, annualQuota, isPaid,
isUnlimited, isActive
unique code
LeaveBalance user, leaveType, year, allocated, used,
pending
unique 
 {user,
leaveType, year}
Holiday date (dateKey), name unique date
LeaveRequest user, leaveType, startDate, endDate
(dateKeys), halfDay (bool, single-day only),
days (number), reason, status (pending|
approved|rejected|cancelled),
approverRole (manager|hr), assignedTo
(ref User, nullable), decidedBy, decidedAt,
decisionNote, timestamps
index 
 {user,
startDate},
{assignedTo,
status}, 
 {status,
startDate}
Attendance user, date (dateKey), checkIn, checkOut,
workedMinutes, status (present|
half-
day|absent), isLate, note, correctedBy,
correctionReason
unique {user, date}

<!-- PAGE 11 -->
5. Roles & permissions matrix (single source of truth)
— = forbidden (403). "Team" = users whose manager is the requester. "Own" = the requester's
own records.
Model Key ﬁelds Indexes / constraints
Announcement title, body, category (announcement|
news|policy|event), priority (normal|
important), pinned, audience (array of roles;
["all"] default), publishAt, expiresAt,
createdBy
index 
 {publishAt,
expiresAt},
{pinned}
TrainingProgram title, description, type (workshop|
online|certification|onboarding),
trainer, mode (onsite|online),
location, startDate, endDate, capacity,
status (draft|scheduled|ongoing|
completed|cancelled), createdBy
(manager)
index 
 {createdBy,
status}
TrainingEnrollment program, user, status (enrolled|
in-
progress|completed|dropped),
completedAt, score, feedback,
managerNote
unique 
 {program,
user}

<!-- PAGE 12 -->
Capability HR Manager Employee
Log in, change own password, view own proﬁle ✔ ✔ ✔
Create / edit / deactivate employees, reset passwords ✔ — —
View employee list & full records All Team (read) —
Employee directory (name, designation, department,
email only)
✔ ✔ ✔
Edit own contact details (phone, address, emergency
contact, dob, gender)
✔ ✔ ✔
Manage departments ✔ read read
Manage leave types, holidays, leave-balance allocation ✔ read read
Apply for / cancel own leave, view own balances ✔ ✔ ✔
Approve / reject leave Any (never
own)
Team only —
View leave requests All Team Own
Check in / out, view own attendance ✔ ✔ ✔
View attendance of others All Team —
Correct attendance records (with reason) ✔ — —
Read announcements addressed to me ✔ ✔ ✔
Create / edit / delete announcements ✔ — —
Create / manage training programs read-only (all) Own programs —
Enroll team members into training — Team only —
View assigned trainings, update own progress — ✔  (as
participant)
✔
Dashboard Company-
wide
Team Personal

<!-- PAGE 13 -->
Backend enforces this with authorize(...)plus ownership/team checks inside services.
The frontend hides what a role cannot use, but the server is the real gate — every acceptance
test checks 403s.
6. Design system & UI speciﬁcation
6.1 Look & feel
Clean, modern, "SaaS dashboard" style on top of Bootstrap 5.3. Calm, professional, high-
contrast, generous whitespace. Light theme (dark mode is optional polish in Chapter 5, using
Bootstrap's data-bs-theme).
6.2 Design tokens (styles/theme.css)
Override Bootstrap via CSS variables; do not fork Bootstrap's Sass.
Base font 15px, headings weight 600, tabular numbers (
font-variant-numeric: tabular-
nums) for tables and stat cards.
6.3 Layout
Auth pages: centered card (max 420px) on a soft gradient background, logo +
"StaffSync" wordmark, tagline "Modern human resource management".
App shell (AppLayout): ﬁxed left sidebar (240px, collapsible to an offcanvas on < 992px)
+ top bar (page title, notiﬁcation-free, user menu with name/role badge → Proﬁle, Change
password, Logout) + content area with container-fluid and 24px padding.
Sidebar menu is role-driven from one conﬁg array (label, icon, path, roles). Icons
from Bootstrap Icons.
--bs-primary: #4F46E5;        /* indigo – primary actions, active nav */
--bs-primary-rgb: 79,70,229;
--bs-success: #16A34A;  --bs-warning: #D97706;  --bs-danger: #DC2626;  --bs-
info: #0284C7;
--bs-body-bg: #F5F7FB;  --bs-body-color: #1F2937;  --bs-secondary-color:
#6B7280;
--bs-border-radius: .625rem;  /* cards, inputs, buttons */
--ss-sidebar-bg: #111827;  --ss-sidebar-text: #CBD5E1;  --ss-sidebar-active:
#4F46E5;
--ss-card-shadow: 0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1);
font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

<!-- PAGE 14 -->
Role Menu
HR Dashboard · Employees · Departments · Leave Requests · Leave Settings (types, holidays) ·
Attendance · Announcements · Training (read-only) · My Proﬁle
Manager Dashboard · My Team · Leave Approvals · My Leaves · Team Attendance · My Attendance ·
Training · Announcements · My Proﬁle
Employee Dashboard · My Leaves · My Attendance · Announcements · My Training · My Proﬁle
6.4 Reusable components (build once in Chapter 1–2, reuse everywhere)
PageHeader (title, breadcrumb, action buttons) · StatCard (icon, label, value, trend text) ·
DataTable (responsive table, loading skeleton, empty state, server pagination, sortable
headers) · SearchFilterBar · StatusBadge (maps status → color: pending=warning,
approved/present/active=success, rejected/absent/inactive=danger, cancelled=secondary,
half-day=info) · ConfirmModal · FormField (label + control + error text) · EmptyState ·
Spinner/PageLoader · ToastProvider (success/error toasts) · ErrorBoundary.
6.5 UX rules
Every async view has loading, empty and error states.
Forms: inline validation messages from server errors[], disabled submit while
pending, success toast.
Destructive actions always go through ConfirmModal.
Tables become stacked cards or horizontally scroll on phones; the whole app is usable at
360px width.
Accessible: labels on all inputs, aria- on icon-only buttons, visible focus, colour is never
the only signal (badges carry text).
Dates display as DD MMM YYYY; times as hh:mm A; durations as 7h 42m.
CHAPTER 1 — Foundation, Authentication & Role-Based Shell
Epic: Project setup & Authentication/Authorization Goal: A running full-stack app where a
user can log in with one of three roles and land on a role-speciﬁc dashboard shell. Everything
later builds on this.
Prerequisites
Node 24 LTS (≥ 22.22), npm, MongoDB running locally (mongod) or an Atlas URI.
1A. Backend tasks
1. Scaffold the layout from 3.1. Initialize git. Create root, server/, client/.

<!-- PAGE 15 -->
2. config/env.js (zod-validated), config/db.js (connect with
serverSelectionTimeoutMS: 5000), server.js (await DB → listen; graceful shutdown
on SIGINT/SIGTERM).
3. app.js: helmet, cors({ origin: CLIENT_ORIGIN, credentials: true }),
express.json({ limit: '100kb' }), cookie-parser, morgan (dev), global 
express-
rate-limit (300 req / 15 min / IP), stricter limiter on /api/auth/login (10 / 15 min /
IP+email key), routes, notFound, error.
4. Models: Department (minimal, needed by seed) and User (full schema from Section 4).
employeeCode is generated by a counter-safe helper (ﬁnd max numeric suffix + 1, retry
on duplicate key). Hash password in an async pre('save') hook (no next), only when
modiﬁed. Instance method comparePassword.
5. Middleware: authenticate (veriﬁes access token, loads user, rejects inactive users and
tokenVersion mismatch is only checked on refresh), authorize(...roles),
validate(schema).
6. Auth routes (all under /api/auth):
Method & path Auth Behavior
GET /api/health none { status: "ok", db: "connected" } (503 if DB down)
POST
/api/auth/login
none Body { email, password }. Same generic error 
 "Invalid
email or password" for unknown email, wrong password and
inactive account (prevents account enumeration). Returns 
 {
accessToken, user } and sets refresh cookie. Updates
lastLoginAt.
POST
/api/auth/refresh
cookie Veriﬁes refresh token + tv; issues new access token (and rotates
the cookie). 401 if invalid.
POST
/api/auth/logout
none Clears cookie. 204.
GET /api/auth/me access Current user (populated department & manager name).
POST
/api/auth/change-
password
access { currentPassword, newPassword }. Password policy: ≥ 8
chars, upper, lower, digit. Clears mustChangePassword,
increments tokenVersion, reissues cookie.
7. Seed script (npm run seed, idempotent — safe to run repeatedly): creates departments
(Human Resources, Engineering, Sales, Finance), then users with password

<!-- PAGE 16 -->
SEED_PASSWORD:
Email Role Notes
hr@staffsync.test hr Department: Human Resources
hr2@staffsync.test hr Second HR (needed so HR leave
requests have another approver in Ch. 3)
manager@staffsync.test manager Engineering
employee1@staffsync.test,
employee2@staffsync.test
employee Engineering, manager = manager@
employee3@staffsync.test employee Sales, no manager (routes to HR)
1B. Frontend tasks
1. Scaffold Vite React app; install the packages from 2.3; conﬁgure the /api proxy; import
Bootstrap CSS, Bootstrap Icons, Inter font, then theme.css.
2. api/http.js: axios instance (baseURL: '/api', withCredentials: true). Request
interceptor attaches the in-memory access token. Response interceptor: on 401 (not from
login/refresh) → call /auth/refresh once (queue concurrent requests), retry; if refresh
fails → clear auth and redirect to /login.
3. AuthContext: user, login(), logout(), loading. On app load, try /auth/refresh
then /auth/me to restore the session (this is how a page reload keeps you logged in
without localStorage).
4. Routing (react-router): /login, /change-password, ProtectedRoute (redirect to
login), RoleRoute roles={[…]} (403 page), / → redirect to the user's dashboard. If
mustChangePassword is true, force /change-password before anything else.
5. Build AuthLayout, AppLayout (sidebar + topbar from 6.3), shared components
PageHeader, StatCard, Spinner, ToastProvider, ErrorBoundary, NotFound,
Forbidden.
6. Pages: Login, ChangePassword, and three dashboard shells (HrDashboard,
ManagerDashboard, EmployeeDashboard) showing a welcome header with the user's
name/role/department and 3–4 placeholder StatCards ("coming in later chapters").
Sidebar shows the full role menu; links to not-yet-built pages show a friendly "Coming
soon" page (not a 404).

<!-- PAGE 17 -->
1C. Automated tests (server/tests/auth.test.js, vitest + supertest + mongodb-memory-
server)
Login success/failure (incl. inactive user, unknown email, same message), rate limiting
present, refresh happy path & invalid/expired token, logout clears cookie, me requires token,
change-password policy + tokenVersion invalidates old refresh token, authorize returns 403
for wrong role, password hash never in any response.
1D. Acceptance tests (run manually and report)
1. npm run seed twice → no duplicate users.
2. npm run dev → API at :5000, client at :5173. GET /api/health is ok.
3. Log in as each of the 3 seeded roles → each lands on its own dashboard with the correct
sidebar.
4. Wrong password → inline error; nothing leaks about whether the email exists.
5. Refresh the browser on a protected page → still logged in. Click Logout → back at /login;
browser Back does not show protected content.
6. Visit an HR-only URL as an employee → Forbidden page; call an HR-only API as an
employee → 403.
7. Wait for / force-expire the access token → the app silently refreshes and continues.
8. Resize to 360px → sidebar becomes an offcanvas menu; nothing overﬂows.
Deﬁnition of Done — Chapter 1
 All 1C tests green; npm run build in client succeeds; ESLint clean
 Acceptance tests 1–8 veriﬁed
 Postman collection has the auth requests; README documents setup + test accounts
docs/DECISIONS.md lists installed versions
 Commit + tag chapter-1
CHAPTER 2 — Employee & Department Management
Epic: Employee management (HR) and personal records (Employee) Goal: HR can fully
manage the workforce; every user can maintain their own record; managers can see their
team.
2A. Backend tasks
1. Finish Department CRUD. Deleting a department that still has users → 409 with
message.
2. Employee endpoints (/api/employees):

<!-- PAGE 18 -->
Method & path Roles Behavior
GET /api/employees HR (all),
Manager
(team only)
Paginated; ﬁlters q, department, role,
status, manager; sort. Manager's results are
forced to manager = req.user.id regardless
of query params.
GET
/api/employees/directory
all Minimal ﬁelds only: name, employeeCode,
designation, department, email. Active users only.
GET /api/employees/team Manager Direct reports (full minimal proﬁle + today's status
can be added in Ch. 4).
POST /api/employees HR Create user. Generates a temporary password
(returned once in the response, never stored in
plain text) and sets 
 mustChangePassword =
true. Validates: unique email, manager must
exist and have role manager (or hr), cannot be
self.
GET /api/employees/:id HR any;
Manager
team;
Employee
self
Else 403.
PUT /api/employees/:id HR Full update except password. Changing role
away from manager while the user still has direct
reports → 409 (reassign ﬁrst). Prevent HR from
demoting/deactivating themselves.
PATCH /api/employees/me all Only: phone, dob, gender, address,
emergencyContact. Anything else is rejected
by the strict schema.
PATCH
/api/employees/:id/status
HR { status: 'active'|'inactive' }.
Deactivating increments tokenVersion (kills
sessions). Cannot deactivate self or the last active
HR.
POST
/api/employees/:id/reset-
HR New temporary password returned once; sets
mustChangePassword; bumps

<!-- PAGE 19 -->
Method & path Roles Behavior
password tokenVersion.
3. Indexes from Section 4 created; text search implemented via case-insensitive regex on
name/email/employeeCode (escape user input to avoid regex injection).
4. Extend the seed with ~12 extra realistic employees across departments (for pagination
testing).
2B. Frontend tasks
1. Build DataTable, SearchFilterBar, StatusBadge, ConfirmModal, FormField
properly here (reused for the rest of the project).
2. HR pages:Employees (table: code, name+email, department, designation, manager, role
badge, status badge, actions; search + ﬁlters + pagination) · EmployeeForm (create/edit in
a page or large modal, grouped sections: Account, Job, Personal, Emergency contact) ·
EmployeeDetail (read view with tabs: Overview now; Leave/Attendance/Training tabs
appear in later chapters) · reset-password modal that shows the temp password with a
copy button and a warning that it is shown once · Departments (list + create/edit modal).
3. Manager page:MyTeam (cards or table of direct reports with contact details).
4. Everyone:MyProfile (view + edit allowed ﬁelds only; job ﬁelds shown read-only) and a
Directory page (searchable list of colleagues) in the sidebar for all roles.
5. Dashboards: HR dashboard now shows real counts (total employees, active, departments,
new joiners this month). Manager dashboard shows team size. Employee dashboard
shows their proﬁle summary.
2C. Automated tests
Permission matrix for every endpoint (HR/Manager/Employee/anonymous), manager scoping
can't be bypassed via query params, strict schema rejects role in PATCH /me, duplicate email
→ 409, cannot deactivate last HR, department delete protection, temp password not
retrievable afterwards, deactivated user's refresh token is rejected.
2D. Acceptance tests
1. HR creates an employee → temp password shown once → new user logs in → forced to
change password → lands on dashboard.
2. HR searches by name/code, ﬁlters by department + status, pages through 15+ rows.
3. HR deactivates an employee → that user's open session is dead on next request and
cannot log in again → HR reactivates → works.
4. Employee edits own phone/address → saved; attempting to edit job title through the API
→ 400.

<!-- PAGE 20 -->
5. Manager sees only their 2 direct reports; calling /api/employees?manager=<other> still
returns only their own team.
6. Employee calling GET /api/employees → 403; directory works for everyone.
Deﬁnition of Done — Chapter 2
 Chapter 1 tests still pass; new tests green; client builds
 Acceptance 1–6 veriﬁed; all forms show server validation errors inline
 Postman + README updated; commit + tag chapter-2
CHAPTER 3 — Leave Management
Epic: Leave management (apply, approve, balances, calendar) Goal: Complete leave lifecycle
with correct balances, correct routing of approvals, and no way to overbook or double-approve.
3A. Business rules (implement in services/leave.service.js)
1. Working days:
days = number of dates in [start, end] that are not weekends
(WEEKEND_DAYS) and not holidays. halfDay is allowed only when start == end,
giving 0.5. If days == 0 → 400 ("selected dates contain no working days").
2. Validation:end ≥ start; start ≥ today − LEAVE_BACKDATE_DAYS; leave type must be
active; reason required (min 5 chars); no overlap with the user's own pending or
approved requests (check by date-range intersection).
3. Balance:available = allocated − used − pending. If the type is not isUnlimited
and days > available → 400 with the available ﬁgure.
4. Applying puts the request in pending and adds days to LeaveBalance.pending
(atomic $inc).
5. Routing (approverRole / assignedTo):
Employee with a manager → that manager.
Employee with no manager → HR pool (assignedTo = null, 
approverRole =
'hr').
Manager → HR pool.
HR → HR pool, but nobody can approve their own request (self-approval returns
403).
HR can approve/reject any pending request; a manager only those where
assignedTo = manager.
6. Decision (approve/reject): only when status = 'pending'. Use a conditional atomic
update 
LeaveRequest.findOneAndUpdate({ _id, status: 'pending' }, { status,
decidedBy, decidedAt, decisionNote }). If it returns null → 409 "already processed"

<!-- PAGE 21 -->
(prevents double-approval races). Then adjust the balance: approve → 
 pending −=
days, used += days; reject → pending −= days. Rejection requires a note.
7. Cancel: the owner may cancel a pending request (release pending), or an approved
request only if startDate is in the future (reduce used). Others → 400.
8. Year rollover: balances are per calendar year. A request spanning two years is rejected
with a message to split it (keeps rules simple; record in DECISIONS).
9. Allocation: when HR creates a user (Ch. 2 endpoint) or a leave type, balances for the
current year are created from annualQuota (create-if-missing logic in a service function
ensureBalances(userId, year), also called lazily when balances are read). HR can
adjust a user's allocated value with a reason.

<!-- PAGE 22 -->
3B. Backend endpoints
Method & path Roles Behavior
/api/leave-types (GET all,
POST/PUT/DELETE)
read: all · write: HR Deleting a type that has requests →
deactivate instead (409 hint). Seed:
Casual (12), Sick (10), Earned (15),
Unpaid (unlimited).
/api/holidays (GET ?year=,
POST/PUT/DELETE)
read: all · write: HR Unique per date. Seed a few sample
holidays for the current year.
GET /api/leaves/balances all Own balances for ?year= (default
current).
GET
/api/leaves/balances/:userId
HR any · Manager
team
PATCH
/api/leaves/balances/:id
HR Adjust allocated, reason required.
Cannot go below used + pending.
POST /api/leaves all Apply (rules above). Response includes
computed days.
GET /api/leaves/my all Own requests, ﬁlter by status/year,
paginated.
GET /api/leaves HR all · Manager
team
Filters: status, user, department, date
range.
GET /api/leaves/pending-
approvals
Manager
(assigned to them)
· HR (HR pool +
any pending)
GET /api/leaves/:id owner · assigned
manager · HR
PATCH
/api/leaves/:id/decision
Manager (team) ·
HR
{ decision:
'approved'|'rejected', note }
PATCH /api/leaves/:id/cancel owner

<!-- PAGE 23 -->
Method & path Roles Behavior
GET /api/leaves/calendar?
month=YYYY-MM
HR all · Manager
team · Employee
own team-mates'
approved leave
(names only)
For the calendar view.
GET /api/leaves/preview?
start&end&halfDay
all Returns 
 { days, holidaysInRange,
weekendsInRange } so the form can
show the count live.
3C. Frontend tasks
1. Employee/Manager/HR — My Leaves: balance cards (one per leave type: allocated /
used / pending / available with a progress bar) + "Apply for leave" button + history table
(type, dates, days, status badge, applied on, cancel action).
2. Apply Leave modal/page: type select (shows available balance), date range pickers, half-
day toggle (only when single date), reason, live day count from /leaves/preview with
warnings (e.g. "includes 1 holiday"), inline server errors.
3. Manager Leave Approvals and HR Leave Requests: tabs Pending / All; each row
opens a detail drawer (requester, dates, days, reason, requester's current balance,
overlapping team leaves that day) with Approve / Reject (reject requires a note) buttons
behind ConfirmModal.
4. HR Leave Settings: tabs Leave types (CRUD) and Holidays (CRUD, year selector), plus
a balance-adjust dialog on the employee detail page (new Leave tab).
5. Leave Calendar (month grid built with plain Bootstrap table/CSS grid — no heavy
calendar library): shows approved leaves and holidays; manager sees team, HR sees all,
employee sees team-mates.
6. Dashboard widgets: HR → pending requests count, on leave today; Manager → pending
approvals (clickable), team on leave today; Employee → remaining balances and next
approved leave.
3D. Automated tests (must include the tricky ones)
Working-day calculation across weekends/holidays/half-day; overlap detection (adjacent days
allowed, overlapping blocked); overbooking blocked using pending; two simultaneous
approvals → exactly one succeeds (Promise.all test); approve/reject/cancel balance
arithmetic (including cancelling an approved future leave); routing for all four requester types;

<!-- PAGE 24 -->
self-approval forbidden; manager cannot decide on another manager's team; spanning two
years rejected; balances never negative.
3E. Acceptance tests
1. employee1 applies for 3 working days of Casual leave spanning a weekend → days
counted correctly, balance pending increases, manager sees it.
2. Manager approves → employee's used increases and pending decreases; employee sees
status "Approved".
3. employee1 applies again for overlapping dates → 400 overlap error. Applies for more
days than available → 400.
4. Manager rejects without note → blocked; with note → balance restored.
5. employee3 (no manager) → request appears in HR's queue, not manager's. manager@'s
own request appears for HR. hr@'s request cannot be approved by hr@ but can by hr2@.
6. Employee cancels an approved future leave → balance restored. Cancelling a past
approved leave → 400.
7. Calendar shows holidays and approved leaves correctly for the selected month.
Deﬁnition of Done — Chapter 3
 Chapters 1–2 tests still green; new tests (including concurrency) green; build passes
 Acceptance 1–7 veriﬁed in the browser
 Postman + README updated; commit + tag chapter-3
CHAPTER 4 — Attendance & Announcements/News
Epics: Attendance tracking · Announcements & news Goal: Employees mark attendance with
reliable server-side rules; HR monitors and corrects it; HR communicates company-wide and
everyone can read what is addressed to them.
4A. Attendance business rules (services/attendance.service.js)
1. Check-in: one record per user per date (company-timezone date key). Time is the
server clock. If a record already exists → 409. If the day is a weekend/holiday → allowed
but ﬂagged note: 'non-working day'. If the user has an approved full-day leave today
→ 409 "you are on approved leave".
2. Late:isLate = localTime(checkIn) > WORK_START + LATE_GRACE_MINUTES.
3. Check-out: requires an existing check-in and no check-out yet (409 otherwise).
Computes workedMinutes. Status: ≥ FULL_DAY_MINUTES → present; 
 ≥
HALF_DAY_MINUTES → half-day; below → half-day is not granted — status absent
with note "insufficient hours" (HR can correct).

<!-- PAGE 25 -->
4. Forgot to check out: record stays open (checkOut = null) and is shown as "Missing
check-out" in reports; HR corrects it. (No cron job required; optional enhancement noted
in DECISIONS.)
5. Derived day status (computed at read time for monthly views, never stored): holiday,
weekend, on-leave (approved leave), present/half-day/absent (stored), or
absent for a past working day with no record and no leave. Future days are blank.
6. HR correction:PUT /api/attendance/:id (or create a record for a missing day) with
required correctionReason; stores correctedBy. Original values are kept in a small
history[] array on the document.

<!-- PAGE 26 -->
4B. Attendance endpoints
Method & path Roles Behavior
POST /api/attendance/check-in all
POST /api/attendance/check-out all
GET /api/attendance/today all Own record for today + server time +
whether check-in/out is allowed
(drives the UI buttons).
GET /api/attendance/my?month=YYYY-MM all Full month with derived statuses +
summary (present, late, half-days,
absent, leave days, total hours).
GET /api/attendance/team?date=YYYY-MM-
DD
Manager Team's status for a day (incl. who is on
leave / not yet checked in).
GET /api/attendance/team/summary?
month=
Manager Per-member monthly summary.
GET /api/attendance?
date=&department=&userId=&status=
HR Paginated company-wide list.
GET /api/attendance/summary?
month=&department=
HR Per-employee monthly summary
table.
GET /api/attendance/export.csv?month= HR CSV download (escape formula-
injection characters = + - @ at cell
start).
PUT /api/attendance/:id, 
POST
/api/attendance/correct
HR Corrections as above.
4C. Announcements business rules & endpoints
Visible to a user when: publishAt ≤ now, expiresAt empty or > now, and audience
contains "all" or the user's role. Ordered: pinned ﬁrst, then publishAt desc.
HR may schedule (future publishAt) and see drafts/scheduled/expired in a "Manage"
list.
Body is plain text with line breaks (or a very small allow-list of Markdown rendered
safely). Never render raw HTML — XSS risk. If you render Markdown, sanitize the

<!-- PAGE 27 -->
output.
Method & path Roles Behavior
GET /api/announcements all Visible ones for me; 
 ?
category=&q=; paginated.
GET /api/announcements/latest?limit=5 all For dashboards.
GET /api/announcements/:id all (if visible
to them)
GET /api/announcements/manage HR All, with state: scheduled / live /
expired.
POST /api/announcements, PUT /:id, 
DELETE
/:id, PATCH /:id/pin
HR
4D. Frontend tasks
1. Attendance widget (dashboard + My Attendance): large live clock (server-synced
offset), big Check in / Check out button with state (disabled/explained when not
allowed), today's times, late badge, worked-time timer.
2. My Attendance: month selector, calendar-style grid or table with colored status chips
and totals card (present / late / half-day / absent / leave / hours).
3. Manager Team Attendance: date picker + table (employee, status, check-in, check-out,
hours) with quick ﬁlter chips (Not checked in / Late / On leave).
4. HR Attendance: ﬁlters (date, department, employee, status), table, monthly summary
tab, Export CSV, correction modal with required reason and audit history view.
5. Announcements: feed page for everyone (cards with category badge, priority marker,
pinned icon, relative date, "read more" expand); dashboard "Latest announcements"
panel. HR Manage Announcements: table with state badges, create/edit form (title, body,
category, priority, audience checkboxes, publish/expiry date-time, pin toggle) and a live
preview.
6. Dashboards: HR → present today / late / on leave / not checked in + latest announcements;
Manager → team present today; Employee → today's attendance card + announcements.
7. Employee detail (HR/Manager): add Attendance tab.
4E. Automated tests
Check-in/out state machine (all 409 paths), late calculation at boundary minutes, status
thresholds, timezone correctness (a check-in at 23:30 UTC belongs to the next local day in

<!-- PAGE 28 -->
Asia/Kolkata), leave-day blocking, derived monthly statuses (weekend/holiday/leave/absent),
manager scoping, HR-only correction with reason, CSV escaping, announcement visibility by
role/schedule/expiry, XSS payload stored but rendered inert.
4F. Acceptance tests
1. Employee checks in → button ﬂips to "Check out"; second check-in is refused with a clear
message.
2. Check in after 09:45 (adjust WORK_START in .env to simulate) → "Late" badge shows.
3. Check-out after ≥ 8h (temporarily lower FULL_DAY_MINUTES to test) → status present;
shorter → ﬂagged.
4. Employee with approved leave today cannot check in.
5. Manager sees team status table matching reality; employee cannot reach it (403).
6. HR corrects a missing check-out with a reason → history shows both versions; CSV
export opens correctly in Excel.
7. HR posts an announcement for audience "employee" only → manager does not see it;
scheduled one appears only after publishAt; expired one disappears; pinned one sorts
ﬁrst.
8. Announcement with <script>alert(1)</script> in the body displays as harmless
text.
Deﬁnition of Done — Chapter 4
 Chapters 1–3 tests still green; new tests green; build passes
 Acceptance 1–8 veriﬁed
 Postman + README updated; commit + tag chapter-4
CHAPTER 5 — Training & Development, Dashboards, Hardening
& Deployment
Epic: Training & development · Reporting/Dashboards · Quality, security, deployment Goal:
Finish the last feature, make the dashboards real, harden the system, and ship a deployable
build.
5A. Training business rules & endpoints
A manager creates programs and enrolls only their direct reports. HR has read-only
visibility of all programs and enrollments. Employees see only programs they are
enrolled in.
Program lifecycle: draft → scheduled → ongoing → completed, or cancelled from
any non-completed state. Only draft/scheduled programs can be fully edited; dates are

<!-- PAGE 29 -->
validated (end ≥ start). Enrollment count may not exceed capacity (409). A user
cannot be enrolled twice (unique index → 409).
Enrollment lifecycle: enrolled → in-progress → completed (or dropped). The
employee updates their own progress and may leave feedback; the manager can record
score and managerNote and mark completion. Completing sets completedAt.
Deleting a program is allowed only in draft with no enrollments; otherwise cancel it.
Method & path Roles Behavior
GET /api/training Manager (own) · HR (all) ·
Employee (enrolled only)
Filters: status, type,
date range, q.
POST /api/training Manager
GET /api/training/:id Manager owner · HR ·
enrolled employee
Includes enrollment
list for manager/HR.
PUT /api/training/:id, 
PATCH
/:id/status, DELETE /:id
Manager owner
POST /api/training/:id/enroll Manager { userIds: [] }
— all must be direct
reports.
DELETE
/api/training/:id/enroll/:userId
Manager Marks dropped if
started, else removes.
GET /api/training/my Employee, Manager Own enrollments with
program info.
PATCH
/api/training/enrollments/:id
Employee (own:
status/feedback) · Manager
(score/note/complete)
GET /api/training/reports/summary Manager (team) · HR
(company)
Completion rate,
programs by status, by
type, per-employee
completions.

<!-- PAGE 30 -->
5B. Dashboards (replace all placeholders with real data)
GET /api/dashboard returns a role-speciﬁc payload (one request per dashboard, built from
existing services):
Role Widgets
HR Total / active employees · Present today · Late today · On leave today · Pending leave requests
· Headcount by department (bar chart) · Leave requests by status this month (donut) · 30-day
attendance rate trend (line) · Upcoming holidays · Latest announcements · Training
completion rate
Manager Team size · Team present/late/on-leave today · Pending approvals (list with quick approve) ·
Team leave calendar strip · Upcoming team trainings · Latest announcements
Employee Today's attendance + check-in button · Leave balances · Next approved leave · My upcoming
trainings · Latest announcements · Upcoming holidays
Charts: use the Chart.js 4 library (chart.js + react-chartjs-2) or lightweight inline SVG
components. Keep charts accessible (title + table fallback/aria-label).
5C. Frontend tasks (training)
Manager Training: program list with status badges, create/edit form (title, type, mode,
trainer, location, dates, capacity, description), program detail with enrollment panel (add
team members via multi-select showing only direct reports, capacity meter, per-person
status, record score/note, mark complete).
Employee My Training: cards for enrolled programs with dates, mode, status; progress
buttons (Start → Mark complete) and feedback box.
HR Training (read-only): all programs, ﬁlter by manager/department, summary stats.
Add Training tab to Employee detail (HR/Manager).
5D. Hardening checklist (do all of these)
Security
 Re-verify every route against the Section 5 matrix with an automated permission-matrix
test that loops over all routes × roles.
 All inputs validated with strict zod schemas; Mongo operator injection blocked (reject keys
starting with $ or containing . in request bodies/queries, or use a sanitizer middleware
compatible with Express 5's read-only req.query).
 Regex search input escaped; CSV export protected against formula injection; no raw HTML
rendering anywhere.

<!-- PAGE 31 -->
helmet with a CSP that allows only what the built client needs; cookies httpOnly, Secure
(production), SameSite=Lax.
 Rate limiting on login/refresh/change-password; generic auth error messages.
 Secrets only from environment; production boot fails on weak/default secrets; 
 npm audit -
-omit=dev shows no high/critical issues.
 Error responses never leak stack traces in production.
Robustness & performance
 Every list is paginated; verify with explain() that main queries use indexes (list in
DECISIONS).
 Graceful shutdown; /api/health used for uptime checks.
 Frontend: route-level code splitting with React.lazy + Suspense; ErrorBoundary at the
layout level; no unhandled promise rejections in the console.
UX polish
 Consistent loading/empty/error states on every page; toasts for every mutation.
 Full keyboard navigation and visible focus; Lighthouse accessibility ≥ 90 on Login and a
dashboard.
 360px, 768px and 1440px layouts checked for every page.
 Optional: dark mode toggle via Bootstrap data-bs-theme, persisted in localStorage
(preference only, not auth).
5E. Production build & deployment
1. npm run build builds client/dist. In production, Express serves it with
express.static and a catch-all app.get('/{*splat}', …) that returns index.html
for non-/api paths (note the Express 5 splat syntax). Unknown /api/* paths still
return JSON 404.
2. Root npm start = node server/src/server.js. Provide a Dockerfile (multi-stage:
build client → copy to server image, node:24-alpine, non-root user) and 
docker-
compose.yml (app + mongo:8, named volume) for one-command local/production-like
runs.
3. Document deployment to a single-service host (Render, Railway or Fly.io) with
MongoDB Atlas: required env vars, Atlas IP allow-list, NODE_ENV=production,
CLIENT_ORIGIN = the public URL, trust proxy enabled behind the platform proxy
(needed for correct client IPs in rate limiting and for Secure cookies).
4. Run the seed script once in production with a strong SEED_PASSWORD, then immediately
change the HR password; remove the demo accounts.

<!-- PAGE 32 -->
5. Final README.md: overview, screenshots (optional), feature list per role, architecture
diagram (text), local setup, env vars table, scripts, test accounts (dev only), API summary
(link to Postman collection), deployment guide, troubleshooting (MongoDB not running,
port in use, CORS/cookie issues).
5F. Automated tests
Training rules (capacity, duplicate enroll, non-team enroll forbidden, lifecycle transitions,
delete rules), dashboard payload shape per role, the full permission-matrix test, injection
attempts ({"email":{"$gt":""}} on login → 400), production-mode error format, static
serving + SPA fallback.
5G. Acceptance tests — full end-to-end script (the demo)
1. Fresh clone → npm install (root + server + client as documented) → .env → 
 npm run
seed → npm run dev.
2. HR creates an employee → employee logs in, changes password, checks in.
3. Employee applies for leave → manager approves → balances and HR dashboard numbers
update.
4. HR posts an announcement → all intended roles see it, others don't.
5. Manager creates a training program, enrolls two team members → employees see it, start
it, complete it with feedback → manager records scores → HR sees completion rate.
6. HR exports attendance CSV for the month.
7. Run npm test (all green), npm run build, then docker compose up and repeat step 3
against the container on :5000.
8. Try to break it: employee hits HR endpoints (403), manager hits another team's data
(403), expired token (silent refresh), NoSQL injection payload (400), 200-char XSS
strings in every text ﬁeld (rendered inert).
Deﬁnition of Done — Chapter 5 (= project complete)
 All tests from Chapters 1–5 green; permission-matrix test green; ESLint clean
 Acceptance 1–8 veriﬁed; hardening checklist fully ticked
 Production build served by Express; Docker run veriﬁed; README ﬁnal; Postman collection
complete
 Commit + tag chapter-5 and v1.0.0
7. Mapping to the project's Jira-style stats (6 epics / 19 tasks)
The brief gives counts only (6 epics, 19 tasks), not names. This plan assumes the following epic
split; adjust if your real board differs.

<!-- PAGE 33 -->
Epic Chapter
1. Setup, authentication & authorization 1
2. Employee & department management 2
3. Leave management 3
4. Attendance tracking 4
5. Announcements & news 4
6. Training & development (+ dashboards/deploy) 5
8. Common pitfalls to avoid (read before starting)
1. Importing react-router-dom — it no longer exists in v8. Import from react-router.
2. Putting JWTs in localStorage — don't. Access token in memory, refresh token in an
httpOnly cookie.
3. Using JS Date for leave/attendance days — use date-key strings in the company
timezone.
4. Trusting the client for time, role or user id — always derive from the server clock and
req.user.
5. Forgetting ownership checks — authorize('manager') alone is not enough; verify the
target user is in the manager's team.
6. Read-then-write race conditions on leave decisions and balances — use conditional
atomic updates.
7. Using transactions on a standalone MongoDB — they will throw; avoid them.
8. Express 5 wildcard '*' — use '/{*splat}'.
9. Calling next() in async Mongoose 9 pre hooks — not supported anymore.
10. Double-loading Bootstrap JS — react-bootstrap already provides it.
11. Starting the server before the DB is connected — causes hanging requests.
12. Skipping the chapter's acceptance tests — a chapter is only "done" when it has been run
in the browser, not just compiled.
End of plan. Start with Chapter 1.