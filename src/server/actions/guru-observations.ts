import { saveDailyObservationsSchema } from './schemas'
import { createServerFn } from '@tanstack/react-start'
import { requireTeacher } from '../authorization'
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

export const saveDailyObservations = createServerFn({ method: 'POST' })
  .middleware([requireTeacher])
  .validator(saveDailyObservationsSchema)
  .handler(({ data, context }) =>
    withTenantCache(async () => {
      const teacher = context.teacher
      const tenant = teacher.tenant
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

      const observedRows = validRows.filter((row) =>
        Object.values(row.values).some((frequency) => frequency !== null),
      )
      const existingObservations =
        await getDb().query.dailyObservations.findMany({
          where: and(
            eq(dailyObservations.schoolId, tenant.id),
            eq(dailyObservations.observedAt, observedAt),
            inArray(dailyObservations.studentId, [...allowedStudentIds]),
          ),
          columns: { id: true },
        })
      const existingObservationIds = existingObservations.map(({ id }) => id)

      if (existingObservationIds.length) {
        await getDb()
          .delete(dailyObservations)
          .where(inArray(dailyObservations.id, existingObservationIds))
      }

      if (!observedRows.length) return

      const observations = await getDb()
        .insert(dailyObservations)
        .values(
          observedRows.map((row) => ({
            schoolId: tenant.id,
            studentId: row.studentId,
            teacherId: teacher.id,
            observedAt,
            note: data.note?.trim() || null,
          })),
        )
        .returning({
          id: dailyObservations.id,
          studentId: dailyObservations.studentId,
        })

      const observationIdByStudent = new Map(
        observations.map((observation) => [
          observation.studentId,
          observation.id,
        ]),
      )
      const scores = observedRows.flatMap((row) => {
        const observationId = observationIdByStudent.get(row.studentId)
        if (!observationId) return []
        return (
          Object.entries(row.values) as Array<[Indicator, Frequency | null]>
        ).flatMap(([indicator, frequency]) =>
          frequency === null ? [] : [{ observationId, indicator, frequency }],
        )
      })

      if (scores.length) {
        await getDb().insert(observationScores).values(scores)
      }
    }),
  )
