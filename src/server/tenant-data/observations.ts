import { and, asc, eq, inArray } from 'drizzle-orm'
import { getDb } from '#/db'
import { dailyObservations, students } from '#/db/schema'
import { todayIso } from '../date'
import type {
  Frequency,
  Indicator,
  ObservationDay,
  Tenant,
} from './types'

export async function getDailyObservationDay(
  tenant: Tenant,
  classId: string,
  observedAt = todayIso(),
): Promise<ObservationDay> {
  const classStudents = await getDb().query.students.findMany({
    where: and(eq(students.schoolId, tenant.id), eq(students.classId, classId)),
    orderBy: [asc(students.name)],
  })

  if (!classStudents.length) return { rows: [], note: '' }

  const observations = await getDb().query.dailyObservations.findMany({
    where: and(
      eq(dailyObservations.schoolId, tenant.id),
      eq(dailyObservations.observedAt, observedAt),
      inArray(
        dailyObservations.studentId,
        classStudents.map((student) => student.id),
      ),
    ),
    with: { scores: true },
  })

  const rows = classStudents.map((student) => {
    const observation = observations.find(
      (item) => item.studentId === student.id,
    )
    const values = {
      respons: 'tidak-terlihat',
      interaksi: 'tidak-terlihat',
      partisipasi: 'tidak-terlihat',
      regulasi: 'tidak-terlihat',
    } as Record<Indicator, Frequency>

    for (const score of observation?.scores ?? []) {
      values[score.indicator] = score.frequency
    }

    return { studentId: student.id, values }
  })

  return { rows, note: observations[0]?.note ?? '' }
}
