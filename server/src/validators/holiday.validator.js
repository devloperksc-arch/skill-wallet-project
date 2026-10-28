import { z } from 'zod';
import { isValidDateKey } from '../services/leave.service.js';

export const createHolidaySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .refine(isValidDateKey, 'Date must be a real calendar date'),
});

export const updateHolidaySchema = createHolidaySchema.partial();
