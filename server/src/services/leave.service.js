import { LeaveType } from '../models/leaveType.model.js';
import { LeaveBalance } from '../models/leaveBalance.model.js';
import { LeaveRequest } from '../models/leaveRequest.model.js';
import { Holiday } from '../models/holiday.model.js';
import { User } from '../models/user.model.js';
import { weekendDays, env } from '../config/env.js';
import { ROLES, APPROVER_ROLE, LEAVE_STATUS } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { todayKey } from '../utils/dates.js';

dayjs.extend(utc);
dayjs.extend(timezone);

/** Today's date key in the COMPANY timezone (not the server's). */
export function getTodayDateKey() {
  return todayKey();
}

export function getMinAllowedDateKey(backdateDays = env.LEAVE_BACKDATE_DAYS ?? 7) {
  return dayjs.tz(todayKey(), env.COMPANY_TZ).subtract(backdateDays, 'day').format('YYYY-MM-DD');
}

export const MAX_LEAVE_RANGE_DAYS = 366;

/** True only for real calendar dates in YYYY-MM-DD form (rejects 2026-02-31, 2026-13-01 ...). */
export function isValidDateKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Years a user may query/create balances for: previous, current and next year. */
export function assertAllowedYear(year) {
  const current = Number(todayKey().slice(0, 4));
  if (!Number.isInteger(year) || year < current - 1 || year > current + 1) {
    throw ApiError.badRequest(`Year must be between ${current - 1} and ${current + 1}`);
  }
  return year;
}

export function getDatesInRange(startStr, endStr) {
  const dates = [];
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const curr = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(Date.UTC(ey, em - 1, ed));

  while (curr <= end) {
    const y = curr.getUTCFullYear();
    const m = String(curr.getUTCMonth() + 1).padStart(2, '0');
    const d = String(curr.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

export async function calculateWorkingDays(startDateStr, endDateStr, halfDay = false) {
  if (!isValidDateKey(startDateStr) || !isValidDateKey(endDateStr)) {
    throw ApiError.badRequest('Dates must be valid calendar dates formatted as YYYY-MM-DD');
  }
  if (endDateStr < startDateStr) {
    throw ApiError.badRequest('End date must be greater than or equal to start date');
  }
  const spanDays = (Date.parse(endDateStr) - Date.parse(startDateStr)) / 86400000 + 1;
  if (spanDays > MAX_LEAVE_RANGE_DAYS) {
    throw ApiError.badRequest(`Date range cannot exceed ${MAX_LEAVE_RANGE_DAYS} days`);
  }

  const allDates = getDatesInRange(startDateStr, endDateStr);
  const holidays = await Holiday.find({
    date: { $gte: startDateStr, $lte: endDateStr },
  }).lean();

  const holidayDateSet = new Set(holidays.map((h) => h.date));
  let workingDaysCount = 0;
  let holidaysInRange = 0;
  let weekendsInRange = 0;

  for (const dateStr of allDates) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

    if (weekendDays.includes(dayOfWeek)) {
      weekendsInRange++;
    } else if (holidayDateSet.has(dateStr)) {
      holidaysInRange++;
    } else {
      workingDaysCount++;
    }
  }

  if (halfDay) {
    if (startDateStr !== endDateStr) {
      throw ApiError.badRequest('Half day is only permitted for single-day leave requests');
    }
    if (workingDaysCount === 0) {
      throw ApiError.badRequest('Selected date contains no working days');
    }
    return {
      days: 0.5,
      workingDaysCount: 0.5,
      holidaysInRange,
      weekendsInRange,
    };
  }

  if (workingDaysCount === 0) {
    throw ApiError.badRequest('Selected dates contain no working days');
  }

  return {
    days: workingDaysCount,
    workingDaysCount,
    holidaysInRange,
    weekendsInRange,
  };
}

export async function ensureBalances(userId, year) {
  const activeLeaveTypes = await LeaveType.find({ isActive: true }).lean();
  if (activeLeaveTypes.length) {
    // Upsert with $setOnInsert: safe under concurrent requests (no duplicate-key races)
    await LeaveBalance.bulkWrite(
      activeLeaveTypes.map((lt) => ({
        updateOne: {
          filter: { user: userId, leaveType: lt._id, year },
          update: {
            $setOnInsert: { allocated: lt.annualQuota, used: 0, pending: 0, adjustments: [] },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }
  return LeaveBalance.find({ user: userId, year }).populate('leaveType');
}

export async function ensureBalancesForLeaveType(leaveType, year) {
  const activeUsers = await User.find({ status: 'active' }).select('_id').lean();
  if (!activeUsers.length) return;
  await LeaveBalance.bulkWrite(
    activeUsers.map((u) => ({
      updateOne: {
        filter: { user: u._id, leaveType: leaveType._id, year },
        update: {
          $setOnInsert: { allocated: leaveType.annualQuota, used: 0, pending: 0, adjustments: [] },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

export function determineRouting(user) {
  if (user.role === ROLES.EMPLOYEE) {
    if (user.manager) {
      return {
        approverRole: APPROVER_ROLE.MANAGER,
        assignedTo: user.manager,
      };
    }
    return {
      approverRole: APPROVER_ROLE.HR,
      assignedTo: null,
    };
  }

  return {
    approverRole: APPROVER_ROLE.HR,
    assignedTo: null,
  };
}
