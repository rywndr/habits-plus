import { describe, expect, it } from 'vitest'
import {
  currentUserSchema,
  aiUsageHistorySchema,
  monthlySummarySchema,
  weeklyNotesSchema,
  exportRangeSchema,
  observationPageSchema,
  parentReportPageSchema,
} from './loader-schemas'

const id = '11111111-1111-4111-8111-111111111111'
const range = { startDate: '2026-09-01', endDate: '2026-09-14' }

describe('GET boundary schemas', () => {
  it.each([
    { schema: currentUserSchema, valid: { role: 'guru' } },
    {
      schema: aiUsageHistorySchema,
      valid: { weekStart: '2026-09-14', classId: id },
    },
    {
      schema: monthlySummarySchema,
      valid: { month: '2026-09', classId: 'all' },
    },
    { schema: weeklyNotesSchema, valid: { weekStart: '2026-09-14' } },
    { schema: exportRangeSchema, valid: range },
    { schema: observationPageSchema, valid: { observedAt: '2026-09-14' } },
    { schema: parentReportPageSchema, valid: { classId: id } },
  ])(
    'accepts valid input and rejects forged ownership and non-objects: $valid',
    ({ schema, valid }) => {
      expect(schema.safeParse(valid).success).toBe(true)
      for (const data of [
        null,
        [],
        'input',
        123,
        { ...valid, tenant: id },
        { ...valid, teacherId: id },
      ]) {
        expect(schema.safeParse(data).success).toBe(false)
      }
    },
  )

  it.each([aiUsageHistorySchema, weeklyNotesSchema, parentReportPageSchema])(
    'rejects invalid week dates',
    (schema) => {
      for (const weekStart of ['2026-02-30', 'yesterday', '', 123, {}]) {
        expect(schema.safeParse({ weekStart }).success).toBe(false)
      }
      expect(schema.safeParse({}).success).toBe(true)
    },
  )

  it('checks role, IDs, month, observation date and export ordering', () => {
    expect(currentUserSchema.safeParse({ role: 'owner' }).success).toBe(false)
    for (const schema of [
      aiUsageHistorySchema,
      monthlySummarySchema,
      weeklyNotesSchema,
      observationPageSchema,
      parentReportPageSchema,
    ]) {
      expect(schema.safeParse({ classId: 'invalid' }).success).toBe(false)
      expect(schema.safeParse({ classId: '' }).success).toBe(true)
    }
    expect(monthlySummarySchema.safeParse({ month: '2026-13' }).success).toBe(
      false,
    )
    expect(
      observationPageSchema.safeParse({ observedAt: '2026-02-30' }).success,
    ).toBe(false)
    expect(
      exportRangeSchema.safeParse({ ...range, startDate: '2026-09-15' })
        .success,
    ).toBe(false)
    expect(
      exportRangeSchema.safeParse({ ...range, endDate: '2026-02-30' }).success,
    ).toBe(false)
    expect(
      exportRangeSchema.safeParse({
        ...range,
        endDate: range.startDate,
        classId: 'all',
      }).success,
    ).toBe(true)
  })
})
