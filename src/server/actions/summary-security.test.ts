import { expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/neon-http'
import type { SQL } from 'drizzle-orm'
import {
  acceptAiSummariesSchema,
  generateAiSummariesSchema,
  saveDailyObservationsSchema,
  deleteSchema,
  addUserSchema,
} from './schemas'

const harness = vi.hoisted(() => ({
  handlers: new Array<
    (input: {
      data: { id: string }
      context: { teacher: { id: string; tenant: { id: string } } }
    }) => Promise<unknown>
  >(),
  where: vi.fn<(query: SQL) => Promise<void>>(async () => {}),
}))
vi.mock('@tanstack/react-start', () => ({
  createMiddleware: () => ({ server: () => ({}) }),
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      validator: () => builder,
      handler: (handler: (typeof harness.handlers)[number]) => {
        harness.handlers.push(handler)
        return handler
      },
    }
    return builder
  },
}))
vi.mock('#/db', () => ({
  getDb: () => ({
    select: (...args: Parameters<ReturnType<typeof drizzle.mock>['select']>) =>
      drizzle.mock().select(...args),
    update: () => ({ set: () => ({ where: harness.where }) }),
    delete: () => ({ where: harness.where }),
  }),
}))
vi.mock('../tenant-data', () => ({
  withTenantCache: (fn: () => Promise<unknown>) => fn(),
}))
vi.mock('../ai/weekly-summary', () => ({}))
await import('./guru-ai-summaries')

it.each([3, 4])(
  'summary mutation %s constrains author, school and current class in the write',
  async (index) => {
    harness.where.mockClear()
    const handler = harness.handlers.at(index)
    if (!handler) throw new Error('Missing mutation')
    await handler({
      data: { id: 'report' },
      context: { teacher: { id: 'teacher-a', tenant: { id: 'school-a' } } },
    })
    const predicate = harness.where.mock.calls.at(0)?.[0]
    if (!predicate) throw new Error('Unrestricted write')
    const query = new PgDialect().sqlToQuery(predicate)
    expect(query.params).toEqual([
      'report',
      'school-a',
      'teacher-a',
      'school-a',
      'teacher-a',
    ])
    expect(query.sql).toContain('"ai_summaries"."teacher_id" = $3')
    expect(query.sql).toContain('"ai_summaries"."class_id" in (select')
    expect(query.sql).toContain('"classes"."teacher_id" = $5')
  },
)
const id = '11111111-1111-4111-8111-111111111111'
it('rejects malformed IDs, dates, oversized batches and forged ownership', () => {
  const valid = { weekStart: '2026-09-14', classId: id, studentIds: [id] }
  expect(generateAiSummariesSchema.safeParse(valid).success).toBe(true)
  for (const override of [
    { weekStart: '2026-02-30' },
    { classId: 'invalid' },
    { studentIds: Array(201).fill(id) },
    { teacherId: id },
    { tenant: id },
  ]) {
    expect(
      generateAiSummariesSchema.safeParse({ ...valid, ...override }).success,
    ).toBe(false)
  }
  expect(deleteSchema.safeParse({ id: 'invalid' }).success).toBe(false)
  expect(
    acceptAiSummariesSchema.safeParse({
      weekStart: valid.weekStart,
      classId: id,
      items: [{ studentId: id, content: 'x'.repeat(10001) }],
    }).success,
  ).toBe(false)
})
it('requires complete observation fields and accepts unmonitored values', () => {
  const values = {
    respons: 'sering',
    interaksi: 'sering',
    partisipasi: 'sering',
    regulasi: 'sering',
  }
  const parse = (scores: unknown) =>
    saveDailyObservationsSchema.safeParse({
      classId: id,
      rows: [{ studentId: id, values: scores }],
    }).success
  expect(parse(values)).toBe(true)
  expect(parse({ ...values, respons: null })).toBe(true)
  expect(parse({ ...values, respons: 'unknown' })).toBe(false)
  expect(parse({ respons: 'sering' })).toBe(false)
})
it('rejects malformed email and weak new credentials', () => {
  const input = {
    name: 'Teacher',
    email: 'teacher@example.test',
    password: 'password123',
    role: 'guru',
  }
  expect(addUserSchema.safeParse(input).success).toBe(true)
  expect(addUserSchema.safeParse({ ...input, email: 'invalid' }).success).toBe(
    false,
  )
  expect(addUserSchema.safeParse({ ...input, password: 'a' }).success).toBe(
    false,
  )
})
