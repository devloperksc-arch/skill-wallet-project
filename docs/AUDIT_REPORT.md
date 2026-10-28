# StaffSync — Problems Report & Remediation

**Scope:** full review of `server/` (Express 5 / Mongoose 9), `client/` (React 19 / Vite 7), Docker, docs, git state.
**Method:** read every source file, then *ran* the project: the original 92 tests, a real MongoDB 8.3.7, probe scripts against the live app, a jsdom render of the client, `npm audit`, and a production build.
**Legend:** ✅ Fixed in this package · ⚠️ Open (needs your action/decision) · 🔎 Confirmed by running it · 📖 Found by reading the code (not executed)

Baseline before changes: 92/92 tests passed — yet 25+ real defects existed, because none of the tests covered them.
After: **121 server tests + 3 client tests pass**, also with no `.env` file present.

---

## 0. Do this first (cannot be fixed by code)

| # | Action | Why |
|---|---|---|
| A | ⚠️ **Revoke the GitHub personal access token** embedded in the git remote URL (`.git/config`, starts `ghp_ABmH…`). Create a new one and use a credential helper / SSH. | Anyone holding this zip or your disk has push access to `devloperksc-arch/skill-wallet-project`. |
| B | ⚠️ **Rotate the JWT secrets and treat the old ones as public.** `docker-compose.yml` with `JWT_*_SECRET` and `SEED_PASSWORD` was committed (commit `4be8372`) and exists in history. Anyone who knows them can forge an HR-admin token. | Rewriting history is optional; rotating is mandatory. |
| C | ⚠️ If the repo is public or any instance was deployed from the old compose file, assume it is compromised (see C-1, C-2, C-3). | |

(The delivered zip excludes `.git`, `node_modules`, `.env`, and `.mongodb_data/`.)

---

## 1. Critical

| ID | Problem | Evidence | Status |
|---|---|---|---|
| C-1 | **Authentication backdoor.** `login()` accepted the passwords `StaffSync@2026` and `Passw0rd!23` for **any account** whenever `NODE_ENV` ≠ `production` — and `NODE_ENV` defaults to `development`. A deploy that forgets the variable gives anyone HR-admin access. | 🔎 HR login with `StaffSync@2026` → 200; employee whose password was changed still logged in with `Passw0rd!23` → 200; closes only when `NODE_ENV=production`. | ✅ Removed. Regression test added. |
| C-2 | **New employees can never log in through the UI.** `/change-password` renders `<AuthLayout><ChangePassword/></AuthLayout>`, but `AuthLayout` ignored `children` and rendered only `<Outlet/>`. Every user HR creates (or resets) is forced to this route and sees an empty card — locked out. API-only acceptance tests couldn't see it. | 🔎 jsdom render: 0 password inputs. | ✅ `AuthLayout` renders children or Outlet. Client test added. |
| C-3 | **Demo credentials shipped to production.** The login page hard-coded a "1-click demo login" panel with the shared password and the HR-admin account, with no dev-only gate. It was present in the built `dist` bundle. | 🔎 `grep` of `dist/assets/*.js` found the password and emails. | ✅ Gated by `import.meta.env.DEV`; verified absent from new build. |
| C-4 | **Secrets committed / world-reachable DB.** `docker-compose.yml` hard-coded JWT secrets and seed password (predictable strings), and published MongoDB `27017` on the host with **no authentication**. | 📖 | ✅ Secrets via `.env`; Mongo has auth, no host port; healthchecks added. |
| C-5 | **No `.dockerignore`.** `COPY server/ ./server/` bakes `server/.env`, local DB files (`.mongodb_data`) and *host* `node_modules` (Windows binaries, e.g. esbuild) into the image, and can break the Alpine build. | 📖 (Docker not available in my sandbox, so not executed.) | ✅ `.dockerignore` added. |

## 2. High

| ID | Problem | Evidence | Status |
|---|---|---|---|
| H-1 | **Access tokens survive password reset / change / deactivation.** `authenticate` never compared the token's `tv` claim with `User.tokenVersion` (only refresh did). A stolen token stayed valid after HR reset the password. | 🔎 old token → 200 after reset. | ✅ Checked on every request; client stores the new token after password change. |
| H-2 | **Server DoS via `/api/leaves/preview`.** No date validation or range cap: one authenticated GET loops over every day between the dates. | 🔎 `2026-01-01 → 9999-12-31`: 5.5 s, +133 MB, and **health check latency 3.3 s** (event loop blocked). A 5-digit year is ~12× worse (OOM crash). | ✅ Real-calendar-date validation + 366-day cap. |
| H-3 | **Privacy leak in team calendar.** `GET /api/leaves/calendar` returned full leave documents to colleagues, including `reason`, `decisionNote`, leave type. | 🔎 A teammate read "Chemotherapy session – private medical" and the HR note. | ✅ Fields stripped; colleagues see "On leave" only. |
| H-4 | **Leave balance corruption (races & failure window).** Availability check and `$inc` were separate; overlap check and create were separate; cancel read-then-saved. | 🔎 6 concurrent applications → 6 overlapping requests, `pending=6`. 4 concurrent cancels of a 1-day leave all returned 200 and decremented 4×. A request rejected with 400 left `pending` at 1 with zero requests (ghost days). | ✅ Atomic conditional reserve, per-user lock, rollback on any failure, atomic cancel. |
| H-5 | **Training mass-assignment.** `updateProgram` did `Object.assign(program, req.body)` with the *raw* body. A manager could change `status` (skipping the state machine) and `createdBy`. | 🔎 draft → `completed` and ownership moved to HR in one PUT. | ✅ Field whitelist; validated payload. |
| H-6 | **Forced password change not enforced by the API.** `mustChangePassword` was only a UI redirect; the temporary password worked for every endpoint. | 🔎 flagged user got 200 on directory and balances. | ✅ 403 until password changed (only `/auth/me`, `change-password`, `logout` allowed). |
| H-7 | **Timezone bug.** Leave rules used the *server's* local date while attendance used `COMPANY_TZ`. On a UTC server between 00:00–05:30 IST, "today" differs by a day (backdating window, cancel-approved-leave check). The correct `utils/dates.js` was dead code. | 🔎 At 00:30 IST: leave service `2026-10-26`, attendance `2026-10-27`. | ✅ One helper, company timezone, everywhere. |
| H-8 | **Dashboard "Upcoming holidays" was always empty** — query filtered on a non-existent `year` field. | 🔎 1 upcoming holiday in DB, dashboard returned 0. | ✅ |
| H-9 | **Tests/CI/README quick-start broken on a fresh checkout.** Without `server/.env` the env validator calls `process.exit(1)` (tests can't even load); `npm run seed` from the repo root fails because `dotenv` reads `.env` from the *current directory*. | 🔎 both reproduced. | ✅ `.env` resolved relative to the file; test env self-supplies secrets. CI workflow added. |

## 3. Medium

| ID | Problem | Status |
|---|---|---|
| M-1 | 🔎 Malformed JSON → **500** (should be 400); body >100 KB → 500 (should be 413). Pollutes error monitoring. | ✅ |
| M-2 | 🔎 `?q=a&q=b` crashes employees and announcements search with 500 (`q.trim` on an array). | ✅ |
| M-3 | 🔎 `sortBy` unvalidated — HR/managers could sort by `passwordHash`. | ✅ whitelist |
| M-4 | 🔎 Login rate limit counted **successful** logins: 5 valid logins + 5 more → 429. A whole office behind one NAT IP gets locked out at 9 AM. | ✅ only failures count |
| M-5 | 📖 README claimed `trust proxy`; none configured → behind a proxy every user shares one rate-limit bucket. | ✅ `TRUST_PROXY` setting |
| M-6 | 🔎 Any employee could create balance rows for any year (`?year=1900`, `99999`) — unbounded DB growth. | ✅ ±1 year |
| M-7 | 🔎 Non-existent calendar dates accepted (`2026-02-31`). | ✅ |
| M-8 | 🔎 `POST /attendance/correct` accepted a non-existent user and an impossible date (201); garbage timestamp → 500. `isLate` not recomputed after a correction. | ✅ |
| M-9 | 🔎 Absent days counted **before the employee's joining date** (a hire from today showed 17 absences). | ✅ |
| M-10 | 🔎 `month` params unvalidated; a CRLF value produced a 500 on CSV export. | ✅ |
| M-11 | 🔎 Seven controllers read raw `req.body` after Zod validation — all trimming/coercion/defaults discarded (root cause of H-5). | ✅ use `req.validated` |
| M-12 | 📖 Seeder would create 19 accounts (2 HR admins) with one well-known password in production, as the README instructed. | ✅ refused in production |
| M-13 | 📖 Employee `PATCH /training/enrollments/:id` had validators written but never wired; dropped employees could never be re-enrolled; duplicate IDs gave a misleading 403. | ✅ |
| M-14 | 📖 Manager changes didn't re-route pending leave (stuck with the old approver); managers with reports could be deactivated; reporting cycles allowed; department existence unchecked on update. | ✅ |
| M-15 | 📖 `ensureBalances` was racy (find-then-create → duplicate-key 409 on first load) and N+1. | ✅ bulk upsert |
| M-16 | 📖 `ApplyLeaveModal` used the UTC date (`toISOString`) for min date; attendance widget swallowed load errors silently. | ✅ |
| M-17 | 📖 Form labels not linked to inputs on Login / Change-password (accessibility). | ✅ tested |
| M-18 | 📖 Temporary passwords shuffled with `Math.random()` sort (biased, non-crypto). Login timing revealed which emails exist. | ✅ |

## 4. Documentation that didn't match the code (all ✅ corrected)

README/DECISIONS claimed: `trust proxy` enabled; "XSS sanitization" (there is none — safety comes from React escaping, which is fine); account **lockout** (none existed); `.strict()` on schemas (3 of ~40); morgan "development only" (ran in production); "86 tests" (92); demo accounts & names (different from seed); and **six API paths were wrong** (`/api/leaves/types`, `/leaves/holidays`, `/leaves/requests`, `/decide`, `/attendance/manage`…).

## 5. Open items — your decision

| Item | Detail | Suggestion |
|---|---|---|
| Zod advisory (high) | `npm audit`: Zod <4.6.6 can exhaust memory on oversized collections. Body limit (100 KB) limits exposure. Fix is a Zod 4 migration. | Plan a Zod 4 upgrade. |
| Vitest advisories | dev-only (critical/moderate); fix = Vitest 5. | Upgrade when convenient. |
| Refresh tokens | Stateless: `logout` only clears the cookie; a stolen refresh token lives 7 days. | Store refresh-token IDs (rotation + reuse detection). |
| No audit log | Role changes, password resets, deactivations, balance adjustments are not recorded. | Add an `AuditLog` collection — important for an HR system. |
| Forgotten check-out | Left as `present` with 0 minutes (documented decision #25), so summaries overstate attendance; overnight shifts unsupported. | Auto-close or flag open records in summaries. |
| Summary vs personal absence | Team/HR summaries count only existing records; "My attendance" also counts missing weekdays as absent. | Align definitions. |
| Dashboard performance | Loads all attendance docs into memory (30-day trend). | Use `$group` aggregation. |
| Employee code | Max-suffix+1 on a string sort breaks beyond `EMP-9999`. | Counter collection. |
| Directory | Every employee can list all staff emails/roles. | Product decision. |
| Leave-type visibility | Managers/HR still see leave category (needed for approvals). | OK; keep. |
| Docker | I could not run Docker in my environment — Docker/compose changes are reviewed, not executed. | Run `docker compose up --build` once. |
| CSP | Helmet adds `upgrade-insecure-requests`; plain-HTTP access from a non-localhost host will fail to load assets. | Serve over HTTPS. |
| HR cannot create training | Only managers can (by design?). | Confirm intent. |

## 6. Verification summary

| Check | Before | After |
|---|---|---|
| Server tests | 92 pass (none covering the defects) | **121 pass**, runs with no `.env` |
| Client tests | none | 3 pass |
| Statement coverage (server) | 64.8 % | 70.4 % |
| Production client build | ok (with demo credentials inside) | ok, credentials absent |
| `npm audit --omit=dev` | 1 high (Zod) | 1 high (Zod) — open |
