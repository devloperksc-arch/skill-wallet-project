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
8. **employeeCode generation**: Find max numeric suffix + 1, retry on duplicate key (no separate counter collection needed).
9. **Morgan request logging**: Only in development. No console.log in committed code.
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

