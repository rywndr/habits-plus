import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { monthlySummaries, weeklyNotes } from '#/db/schema'
import { weekStartIso } from '../date'
import { withTenantCache } from '../tenant-data'
import { assertTeacherOwnsClass, assertText, resolveTenant } from './shared'
import type {
  DeleteInput,
  SaveMonthlySummaryInput,
  SaveWeeklyNoteInput,
} from './types'

export const saveWeeklyNote = createServerFn({ method: 'POST' })
  .inputValidator((data: SaveWeeklyNoteInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      assertText(data.p1, 'P1')
      assertText(data.p2, 'P2')
      assertText(data.p3, 'P3')

      const tenant = await resolveTenant(data)
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      await assertTeacherOwnsClass(tenant.id, teacher.id, data.classId)
      const weekStart = data.weekStart ?? weekStartIso()

      await getDb()
        .insert(weeklyNotes)
        .values({
          schoolId: tenant.id,
          teacherId: teacher.id,
          classId: data.classId,
          weekStart,
          p1: data.p1.trim(),
          p2: data.p2.trim(),
          p3: data.p3.trim(),
        })
        .onConflictDoUpdate({
          target: [
            weeklyNotes.schoolId,
            weeklyNotes.teacherId,
            weeklyNotes.classId,
            weeklyNotes.weekStart,
          ],
          set: {
            teacherId: teacher.id,
            p1: data.p1.trim(),
            p2: data.p2.trim(),
            p3: data.p3.trim(),
            updatedAt: new Date(),
          },
        })
    }),
  )

export const deleteWeeklyNote = createServerFn({ method: 'POST' })
  .inputValidator((data: DeleteInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')

      await getDb()
        .delete(weeklyNotes)
        .where(
          and(
            eq(weeklyNotes.schoolId, tenant.id),
            eq(weeklyNotes.id, data.id),
            eq(weeklyNotes.teacherId, teacher.id),
          ),
        )
    }),
  )

export const saveMonthlySummary = createServerFn({ method: 'POST' })
  .inputValidator((data: SaveMonthlySummaryInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      assertText(data.month, 'Bulan')
      assertText(data.text, 'Ringkasan')

      const tenant = await resolveTenant(data)
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      await assertTeacherOwnsClass(tenant.id, teacher.id, data.classId)
      const monthStart = `${data.month.slice(0, 7)}-01`

      await getDb()
        .insert(monthlySummaries)
        .values({
          schoolId: tenant.id,
          teacherId: teacher.id,
          classId: data.classId,
          monthStart,
          text: data.text.trim(),
        })
        .onConflictDoUpdate({
          target: [
            monthlySummaries.schoolId,
            monthlySummaries.teacherId,
            monthlySummaries.classId,
            monthlySummaries.monthStart,
          ],
          set: {
            teacherId: teacher.id,
            text: data.text.trim(),
            updatedAt: new Date(),
          },
        })
    }),
  )
