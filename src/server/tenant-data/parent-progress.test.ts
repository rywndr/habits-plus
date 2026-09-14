import { beforeEach, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import type { SQL } from 'drizzle-orm'
import type { aiSummaries, students } from '#/db/schema'
import { getParentProgress } from './dashboards'
import { getActiveAiSummariesForStudent } from './ai-summaries'

const database = vi.hoisted(() => {
  const findChild =
    vi.fn<
      (options: {
        where: SQL
      }) => Promise<typeof students.$inferSelect | undefined>
    >()
  const findSummaries =
    vi.fn<
      (options: {
        where: SQL
      }) => Promise<Array<typeof aiSummaries.$inferSelect>>
    >()
  const where = vi.fn<(condition: SQL) => Promise<Array<never>>>(async () => [])
  const select = vi.fn(() => ({
    from: () => ({ innerJoin: () => ({ where }) }),
  }))
  return {
    query: {
      students: { findFirst: findChild },
      aiSummaries: { findMany: findSummaries },
    },
    findChild,
    findSummaries,
    select,
    where,
  }
})

vi.mock('#/db', () => ({ getDb: () => database }))

const tenant = {
  id: 'school-a',
  slug: 'school-a',
  name: 'School A',
  region: 'Region',
}
const child = {
  id: 'child-a',
  schoolId: tenant.id,
  parentId: 'parent-a',
  classId: 'class-a',
  nisn: '123',
  name: 'Own child',
  gender: 'L',
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies typeof students.$inferSelect

beforeEach(() => {
  vi.clearAllMocks()
  database.findChild.mockResolvedValue(child)
  database.findSummaries.mockResolvedValue([])
})

it('requires both the authenticated parent and school when finding a child', async () => {
  await getParentProgress(tenant, 'parent-a')
  const condition = database.findChild.mock.calls.at(0)?.[0].where
  if (!condition) throw new Error('Missing child query')
  const query = new PgDialect().sqlToQuery(condition)
  expect(query.sql).toBe(
    '("students"."school_id" = $1 and "students"."parent_id" = $2)',
  )
  expect(query.params).toEqual([tenant.id, 'parent-a'])
})

it('returns no reports and runs no secondary queries when no child belongs to this parent and school', async () => {
  database.findChild.mockResolvedValue(undefined)
  const progress = await getParentProgress(tenant, 'parent-without-child')
  expect(progress.childName).toBe('Anak')
  expect(progress.summaryText).toBe('')
  expect(progress.history).toEqual([])
  expect(database.findSummaries).not.toHaveBeenCalled()
  expect(database.select).not.toHaveBeenCalled()
})

it('requires the school, child, and active status when fetching reports', async () => {
  await getActiveAiSummariesForStudent(tenant, child.id)
  const condition = database.findSummaries.mock.calls.at(0)?.[0].where
  if (!condition) throw new Error('Missing summary query')
  const query = new PgDialect().sqlToQuery(condition)
  expect(query.sql).toBe(
    '("ai_summaries"."school_id" = $1 and "ai_summaries"."student_id" = $2 and "ai_summaries"."status" = $3)',
  )
  expect(query.params).toEqual([tenant.id, child.id, 'active'])
})

it('returns approved child reports and keeps observations scoped to the same school and child', async () => {
  database.findSummaries.mockResolvedValue([
    {
      id: 'report-a',
      schoolId: tenant.id,
      studentId: child.id,
      classId: child.classId,
      teacherId: 'teacher-a',
      weekStart: '2026-09-07',
      content: 'Approved child report',
      status: 'active',
      model: 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])
  const progress = await getParentProgress(tenant, 'parent-a')
  expect(progress.childName).toBe(child.name)
  expect(progress.summaryText).toBe('Approved child report')
  const condition = database.where.mock.calls.at(0)?.[0]
  if (!condition) throw new Error('Missing observation query')
  const query = new PgDialect().sqlToQuery(condition)
  expect(query.sql).toContain('"daily_observations"."school_id" = $1')
  expect(query.sql).toContain('"daily_observations"."student_id" = $2')
  expect(query.params.slice(0, 2)).toEqual([tenant.id, child.id])
})
