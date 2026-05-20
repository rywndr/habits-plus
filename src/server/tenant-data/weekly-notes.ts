import { desc, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { weeklyNotes } from '#/db/schema'
import { formatIndonesianDate } from '../date'
import type { Tenant, WeeklyNote } from './types'

export async function getWeeklyNotes(
  tenant: Tenant,
): Promise<Array<WeeklyNote>> {
  const rows = await getDb().query.weeklyNotes.findMany({
    where: eq(weeklyNotes.schoolId, tenant.id),
    orderBy: [desc(weeklyNotes.weekStart)],
  })

  return rows.map((note) => ({
    id: note.id,
    date: note.weekStart,
    dateLabel: formatIndonesianDate(note.weekStart),
    p1: note.p1,
    p2: note.p2,
    p3: note.p3,
  }))
}
