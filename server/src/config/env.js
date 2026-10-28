import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

// Always load server/.env regardless of the process working directory
// (fixes `npm run seed` / `npm start` from the repo root).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// In tests we supply safe throw-away secrets so CI works without a .env file.
if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-min-32-chars-xx';
  process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-min-32-chars-x';
  process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/staffsync-test';
}

const bool = z
  .enum(['true', 'false', '1', '0'])
  .default('false')
  .transform((v) => v === 'true' || v === '1');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  COMPANY_TZ: z.string().default('Asia/Kolkata'),
  WORK_START: z.string().default('09:30'),
  LATE_GRACE_MINUTES: z.coerce.number().default(15),
  FULL_DAY_MINUTES: z.coerce.number().default(480),
  HALF_DAY_MINUTES: z.coerce.number().default(240),
  WEEKEND_DAYS: z.string().default('0,6'),
  LEAVE_BACKDATE_DAYS: z.coerce.number().default(7),
  SEED_PASSWORD: z.string().default('Passw0rd!23'),
  // Number of reverse-proxy hops to trust for client IP (0 = none). Set 1 behind nginx/Render/etc.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // Production only: allow seeding the demo accounts (never enable on a real system)
  ALLOW_DEMO_SEED: bool,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const weekendDays = env.WEEKEND_DAYS.split(',').map(Number);
