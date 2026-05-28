import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '#/db'
import {
  classes,
  dailyObservations,
  observationScores,
  students,
} from '#/db/schema'
import type { Frequency, Indicator } from '#/db/schema'
import { todayIso } from '../date'
import { withTenantCache } from '../tenant-data'
import { resolveTenant } from './shared'
import type { SaveDailyObservationsInput } from './types'

export const saveDailyObservations = createServerFn({ method: 'POST' })
  .inputValidator((data: SaveDailyObservationsInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      const tenant = await resolveTenant(data)
      const teacher = await getAuthenticatedUserByRole('guru')
      const observedAt = data.observedAt ?? todayIso()
      const assignedClass = await getDb().query.classes.findFirst({
        where: and(
          eq(classes.schoolId, tenant.id),
          eq(classes.id, data.classId),
          eq(classes.teacherId, teacher.id),
        ),
      })

      if (!assignedClass) {
        throw new Error('Kelas tidak ditugaskan ke guru ini.')
      }

      const studentIds = data.rows.map((row) => row.studentId)
      const classStudents = await getDb().query.students.findMany({
        where: and(
          eq(students.schoolId, tenant.id),
          eq(students.classId, data.classId),
          inArray(students.id, studentIds),
        ),
      })
      const allowedStudentIds = new Set(
        classStudents.map((student) => student.id),
      )
      const validRows = data.rows.filter((row) =>
        allowedStudentIds.has(row.studentId),
      )

      if (!validRows.length) return

      const observations = await getDb()
        .insert(dailyObservations)
        .values(
          validRows.map((row) => ({
            schoolId: tenant.id,
            studentId: row.studentId,
            teacherId: teacher.id,
            observedAt,
            note: data.note?.trim() || null,
          })),
        )
        .onConflictDoUpdate({
          target: [dailyObservations.studentId, dailyObservations.observedAt],
          set: {
            teacherId: teacher.id,
            note: data.note?.trim() || null,
            updatedAt: new Date(),
          },
        })
        .returning({
          id: dailyObservations.id,
          studentId: dailyObservations.studentId,
        })

      const observationIds = observations.map((observation) => observation.id)
      const observationIdByStudent = new Map(
        observations.map((observation) => [
          observation.studentId,
          observation.id,
        ]),
      )
      const scores = validRows.flatMap((row) => {
        const observationId = observationIdByStudent.get(row.studentId)
        if (!observationId) return []
        return (
          Object.entries(row.values) as Array<[Indicator, Frequency]>
        ).map(([indicator, frequency]) => ({
          observationId,
          indicator,
          frequency,
        }))
      })

      if (observationIds.length) {
        await getDb()
          .delete(observationScores)
          .where(inArray(observationScores.observationId, observationIds))
      }

      if (scores.length) {
        await getDb().insert(observationScores).values(scores)
      }
    }),
  )
