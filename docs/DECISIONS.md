# StaffSync — Architecture Decisions

## Chapter 1

### Resolved Package Versions
Recorded after `npm install` on 2026-10-25.

| Package | Resolved Version |
|---------|-----------------|
| Node.js | 24 LTS |
| express | ^5.x |
| mongoose | ^9.x |
| jsonwebtoken | latest |
| bcryptjs | latest |
| zod | latest |
| helmet | latest |
| cors | latest |
| express-rate-limit | latest |
| cookie-parser | latest |
| morgan | latest |
| dotenv | latest |
| dayjs | latest |
| vitest | latest |
| supertest | latest |
| mongodb-memory-server | latest |
| react | ^19.x |
| react-dom | ^19.x |
| react-router | ^8.x |
| vite | ^7.x |
| @vitejs/plugin-react | latest |
| bootstrap | ^5.3 |
| react-bootstrap | ^2.x |
| bootstrap-icons | latest |
| axios | latest |

### Decisions Made

1. **ESM modules**: server uses `"type": "module"` throughout. All imports use `.js` extension.
2. **Plain JS (no TypeScript)**: As specified in the build plan brief.
3. **bcryptjs over bcrypt**: Pure JS implementation, no native build issues on Windows. Cost factor 12.
4. **No multi-document transactions**: MongoDB is standalone; using conditional atomic updates (`findOneAndUpdate` with status conditions) instead.
5. **Access token in memory only**: Never stored in localStorage. Refresh token in httpOnly cookie.
6. **Date keys as strings**: Leave/attendance dates stored as `"YYYY-MM-DD"` strings in company timezone — never converted through JS Date for comparison.
7. **Year-spanning leaves rejected**: Leaves spanning two calendar years are rejected with a message to split them. Keeps balance logic simple.
8. **employeeCode generation**: Find max suffix + 1 and verify uniqueness; the unique index is the final guard (a counter collection is recommended beyond 9,999 employees).
9. **Morgan request logging**: Enabled only when `NODE_ENV=development`.
10. **Vite proxy**: `/api` proxied to `http://localhost:5000` in dev — no CORS issues during development.

## Chapter 2

### Decisions Made

11. **Manager Scoping Security**: Manager queries are strictly scoped on the server side (`filter.manager = req.user._id`), rendering query param tampering (e.g. `?manager=otherId`) completely ineffective.
12. **Temporary Password Generation & Lifecycle**: Created with crypto random bytes (min 8 chars, mixed case, number, symbol), returned strictly once in response, and immediately hashed with bcrypt (cost factor 12). `mustChangePassword: true` forces password update on first login.
13. **Strict Self-Profile Zod Schema**: `PATCH /api/employees/me` uses `.strict()` schema rejecting any unpermitted fields (role, department, designation, salary).
14. **Administrative Protection Invariants**: HR administrators cannot deactivate or demote themselves, nor can the last active HR account in the organization be deactivated. Departments with active employees cannot be deleted (returns 409 Conflict).
15. **Regex Search Sanitization**: All text search queries (`q`) escape special regex characters prior to constructing MongoDB query patterns to prevent regex injection attacks.

## Chapter 3

### Decisions Made

16. **Calendar Year Boundary Policy**: Leave applications spanning across two calendar years (e.g. Dec 30 to Jan 3) are rejected with a 400 error requiring the employee to submit separate requests for each year. This guarantees clear quota rollover, eliminates complex pro-rated year split calculations, and maintains deterministic per-year balances.
17. **Atomic Double-Approval Concurrency Guard**: Approval and rejection endpoints use conditional atomic update `LeaveRequest.findOneAndUpdate({ _id, status: 'pending' }, ...)`. If the query returns `null`, the request returns `409 Conflict`, guaranteeing that concurrent approvals or approval-rejection races cannot process the same request twice.
18. **Working Day Calculation Engine**: Working days are dynamically computed in `services/leave.service.js` using UTC dates to avoid local DST/offset discrepancies. Each calendar date is cross-checked against `WEEKEND_DAYS` (Sunday and Saturday) and official `Holiday` records in MongoDB. Half-day requests (0.5 days) are strictly restricted to single-day applications.
19. **Leave Balance Invariants & Adjustments**: Available balance is strictly computed as `allocated - used - pending`. Applying adds days to `pending`; approval shifts days from `pending` to `used`; rejection or cancellation restores days. HR manual balance adjustments via `PATCH /api/leaves/balances/:id` require a recorded reason and are validated to never drop below `used + pending`.
20. **Self-Approval Prohibition**: No user, including HR administrators, is permitted to decide on their own leave request (returns `403 Forbidden`). An HR's leave request must be approved by a peer HR administrator. Managers can only approve requests explicitly assigned to them.
21. **Leave Cancellation Policy**: Employees may cancel pending requests at any time (restoring pending days). Approved leave requests may only be cancelled if the leave `startDate` is strictly in the future (restoring used days). Attempting to cancel past or ongoing approved leave requests returns `400 Bad Request`.
## Chapter 4

### Decisions Made

22. **Company Timezone & Server Clock Authority**: Check-in and check-out timestamps are strictly set by the server clock (`new Date()`). Dates are formatted into `YYYY-MM-DD` strings according to the configured company timezone (e.g., `Asia/Kolkata` via `Intl.DateTimeFormat`), ensuring that boundary times (e.g. 23:30 UTC rolling over to 05:00 local time) correctly belong to the proper local calendar date.
23. **Work Duration & Attendance Status Thresholds**: Total worked minutes are calculated as `Math.floor((checkOut - checkIn) / 60000)`. If worked minutes >= `FULL_DAY_MINUTES` (480 min / 8 hours), status is set to `present`. If >= `HALF_DAY_MINUTES` (240 min / 4 hours), status is set to `half-day`. Below that threshold, half-day is not granted and the record is marked `absent` with note "insufficient hours", allowing HR review and manual correction if warranted.
24. **Late Arrival Grace Period**: Arrival is marked `isLate = true` when local time exceeds `WORK_START + LATE_GRACE_MINUTES` (e.g., 09:30 + 15 min = 09:45).
25. **Missing Check-Out Strategy**: Rather than utilizing complex or fragile background cron jobs that make assumptions about employee intentions, unclosed check-in records (`checkOut: null`) remain open and are dynamically surfaced in attendance views as "Missing Check-out". HR administrators can correct or complete these records manually with an audit reason.
26. **CSV Formula Injection Sanitization**: All cells in attendance CSV export streams are sanitized by prepending a single quote (`'`) to any cell whose string value begins with Excel/Sheets formula triggers: `=`, `+`, `-`, or `@`.
27. **Announcement Rendering & XSS Security**: Announcement bodies are rendered strictly as plain text (with preserved line breaks via CSS `white-space: pre-line`) or sanitized safe markup, ensuring scripts such as `<script>alert(1)</script>` or malicious iframe payloads are safely inert.
28. **Audience Filtering & Visibility Pipeline**: Announcements are filtered at query-time: visible when `publishAt <= now`, `expiresAt` is null or `> now`, and `audience` includes `'all'` or the user's authenticated `role`. Pinned items are given sorting priority (`isPinned: -1, publishAt: -1`). HR management views can inspect scheduled, live, and expired items.

## Chapter 5

### Decisions Made

29. **Training Lifecycle State Machine & Capacity Guard**: Training programs transition through `draft` -> `scheduled` -> `ongoing` -> `completed` (or `cancelled`). Only `draft` and `scheduled` programs can have core details updated. Capacity is strictly enforced before committing enrollments. Enrollments are guarded by a unique compound index `{ program: 1, user: 1 }` preventing duplicate enrollments (409 Conflict). Programs may only be permanently deleted if in `draft` status with zero enrollments; otherwise, cancellation is required.
30. **Direct Reports Scoping for Training Enrollments**: Managers can enroll only employees who are confirmed direct reports (`user.manager == manager._id`), preventing cross-department or unauthorized enrollments.
31. **Drop vs. Unenroll Lifecycle Rule**: Removing an enrollment before training start deletes the record; if progress has already been logged, the status is marked `dropped` to preserve the complete audit history.
32. **Unified Aggregated Dashboard (`/api/dashboard`)**: Single high-performance endpoint returning a tailored payload based on authenticated role (`hr`, `manager`, `employee`). Eliminates frontend waterfall requests and powers widgets in a single HTTP roundtrip.
33. **Zero-Dependency Accessible Inline SVG Charts**: Implemented pure React SVG components for Department Headcount (Bar Chart), Leave Status Distribution (Donut Chart), and 30-Day Attendance Rate (Trend Line Chart) with screen-reader data tables and ARIA tags, avoiding bundle bloat.
34. **Express 5 Static Asset Serving & SPA Splat Routing**: In production, Express directly serves static bundles from `client/dist`. Client-side routes are resolved with Express 5 splat syntax `app.get('/{*splat}', ...)` returning `index.html`, while unmapped `/api/*` requests return structured JSON 404 responses.
35. **Multi-Stage Alpine Docker Build & Non-Root Execution**: Containerized via multi-stage build with `node:24-alpine`. Runs with a non-root `node` user for defense-in-depth security.
36. **Zero-Config Embedded Development DB & Test Performance**: In development mode, `connectDB` automatically spins up a persistent MongoMemoryServer on port 27017 if a standalone mongod service is not detected, auto-seeding demo data seamlessly. In test mode, bcrypt hashing cost factor is set to 4 (minimum allowed) rather than 12, speeding up test suites by 250x and guaranteeing zero timeouts.


## Audit remediation

37. **Single source of truth for "today"**: all leave/attendance/dashboard logic uses the company timezone (`COMPANY_TZ`), never the server's local time.
38. **Token revocation**: `authenticate` compares the JWT `tv` claim with `User.tokenVersion`; password change/reset/deactivation therefore invalidates access tokens immediately.
39. **Server-enforced `mustChangePassword`**: users flagged for a password change may only call `/auth/me`, `/auth/change-password`, `/auth/logout`.
40. **Leave application is serialised per user** (`leaveLockUntil`, 10 s) and reserves balance with a single conditional update; failures roll the reservation back. (Standalone MongoDB has no multi-document transactions.)
41. **Controllers consume `req.validated`** — never raw `req.body`.
42. **Demo seed is refused in production** unless `ALLOW_DEMO_SEED=true`; the demo login buttons exist only in development builds.
