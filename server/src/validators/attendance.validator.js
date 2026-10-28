import { z } from 'zod';
import { ATTENDANCE_STATUS } from '../config/constants.js';
import { isValidDateKey } from '../services/leave.service.js';

const isoDateTime = z.string().datetime({ offset: true, message: 'Must be an ISO-8601 date-time' });
const reason = z.string().trim().min(3, 'Correction reason is required (min 3 characters)').max(500);

export const attendanceCorrectionSchema = z.object({
  checkIn: isoDateTime.optional(),
  checkOut: isoDateTime.nullable().optional(),
  status: z.enum(Object.values(ATTENDANCE_STATUS)).optional(),
  correctionReason: reason,
});

export const createMissingAttendanceSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .refine(isValidDateKey, 'Date must be a real calendar date'),
  checkIn: isoDateTime,
  checkOut: isoDateTime.nullable().optional(),
  status: z.enum(Object.values(ATTENDANCE_STATUS)).optional(),
  correctionReason: reason,
});
