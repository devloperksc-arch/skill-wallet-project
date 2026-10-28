import { z } from 'zod';
import { isValidDateKey } from '../services/leave.service.js';

const dateKey = (label) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be formatted as YYYY-MM-DD`)
    .refine(isValidDateKey, `${label} must be a real calendar date`);

export const applyLeaveSchema = z
  .object({
    leaveType: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid leave type ID'),
    startDate: dateKey('Start date'),
    endDate: dateKey('End date'),
    halfDay: z.boolean().default(false),
    reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(500),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be greater than or equal to start date',
    path: ['endDate'],
  })
  .refine((data) => !data.halfDay || data.startDate === data.endDate, {
    message: 'Half day is only permitted for single-day leave requests',
    path: ['halfDay'],
  });

export const leaveDecisionSchema = z
  .object({
    decision: z.enum(['approved', 'rejected']),
    note: z.string().trim().optional().default(''),
  })
  .refine((data) => data.decision !== 'rejected' || (data.note && data.note.length >= 3), {
    message: 'Decision note is required when rejecting a leave request (min 3 characters)',
    path: ['note'],
  });

export const adjustBalanceSchema = z.object({
  allocated: z.number({ invalid_type_error: 'Allocated must be a number' }).min(0, 'Allocated days must be 0 or more').max(366),
  reason: z.string().trim().min(3, 'Adjustment reason is required (min 3 characters)'),
});
