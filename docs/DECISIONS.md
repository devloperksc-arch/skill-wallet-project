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
