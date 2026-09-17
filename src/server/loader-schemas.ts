import { z } from 'zod'
import { roleEnum } from '#/db/schema/enums'

const classId = z.union([z.uuid(), z.literal('')]).optional()
const classFilter = z
  .union([z.uuid(), z.literal(''), z.literal('all')])
  .optional()
const date = z.iso.date()

export const currentUserSchema = z.strictObject({
  role: z.enum(roleEnum.enumValues),
})

export const aiUsageHistorySchema = z.strictObject({
  weekStart: date.optional(),
  classId: classFilter,
})

export const monthlySummarySchema = z.strictObject({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  classId: classFilter,
})

export const weeklyNotesSchema = z.strictObject({
  weekStart: date.optional(),
  classId: classFilter,
})

export const exportRangeSchema = z
  .strictObject({
    startDate: date,
    endDate: date,
    classId: classFilter,
  })
  .refine(({ startDate, endDate }) => startDate <= endDate, {
    message: 'Tanggal akhir harus sama dengan atau setelah tanggal mulai.',
    path: ['endDate'],
  })

export const observationPageSchema = z.strictObject({
  observedAt: date.optional(),
  classId,
})

export const dailyAvailabilityMonthSchema = z.strictObject({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  classId: z.uuid(),
})

export const parentReportPageSchema = z.strictObject({
  weekStart: date.optional(),
  classId,
})
