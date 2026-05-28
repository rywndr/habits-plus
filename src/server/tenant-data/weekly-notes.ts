import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { classes, weeklyNotes } from '#/db/schema'
import { formatIndonesianDate } from '../date'
import type { Tenant, WeeklyNote } from './types'

export async function getWeeklyNotes(
  tenant: Tenant,
  teacherId?: string,
  classId?: string,
): Promise<Array<WeeklyNote>> {
  const filters = [eq(weeklyNotes.schoolId, tenant.id)]
  if (teacherId) filters.push(eq(weeklyNotes.teacherId, teacherId))
  if (classId) filters.push(eq(weeklyNotes.classId, classId))

  const rows = await getDb()
    .select({
      id: weeklyNotes.id,
      weekStart: weeklyNotes.weekStart,
      classId: weeklyNotes.classId,
      className: classes.name,
      p1: weeklyNotes.p1,
      p2: weeklyNotes.p2,
      p3: weeklyNotes.p3,
    })
    .from(weeklyNotes)
    .leftJoin(classes, eq(weeklyNotes.classId, classes.id))
    .where(and(...filters))
    .orderBy(desc(weeklyNotes.weekStart))

  return rows.map((note) => ({
    id: note.id,
    date: note.weekStart,
    dateLabel: formatIndonesianDate(note.weekStart),
    classId: note.classId,
    className: note.className,
    p1: note.p1,
    p2: note.p2,
    p3: note.p3,
  }))
}
