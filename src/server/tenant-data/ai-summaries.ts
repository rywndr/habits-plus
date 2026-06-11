import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import { getDb } from '#/db'
import {
  aiGenerationLogs,
  aiSummaries,
  classes,
  dailyObservations,
  observationScores,
  students,
  weeklyNotes,
} from '#/db/schema'
import { addDaysIso, formatIndonesianDate } from '../date'
import type { Frequency, Indicator, Tenant } from './types'

export type StudentWeekDayData = {
  date: string
  scores: Partial<Record<Indicator, Frequency>>
  note: string | null
}

export type AiSummaryListItem = {
  id: string
  studentId: string
  studentName: string
  weekStart: string
  content: string
  createdLabel: string
}

export type AiGenerationHistoryEntry = {
  id: string
  createdLabel: string
  weekStart: string
  className: string | null
  studentCount: number
  promptTokens: number
  cachedTokens: number
  completionTokens: number
  costUsd: number
}

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export async function getClassWeekObservations(
  tenant: Tenant,
  classId: string,
  weekStart: string,
): Promise<Map<string, Array<StudentWeekDayData>>> {
  const weekEnd = addDaysIso(weekStart, 6)
  const rows = await getDb()
    .select({
      studentId: dailyObservations.studentId,
      observedAt: dailyObservations.observedAt,
      note: dailyObservations.note,
      indicator: observationScores.indicator,
      frequency: observationScores.frequency,
    })
    .from(dailyObservations)
    .innerJoin(students, eq(dailyObservations.studentId, students.id))
    .leftJoin(
      observationScores,
      eq(observationScores.observationId, dailyObservations.id),
    )
    .where(
      and(
        eq(dailyObservations.schoolId, tenant.id),
        eq(students.classId, classId),
        gte(dailyObservations.observedAt, weekStart),
        lte(dailyObservations.observedAt, weekEnd),
      ),
    )
    .orderBy(asc(dailyObservations.observedAt))

  const byStudent = new Map<string, Array<StudentWeekDayData>>()
  for (const row of rows) {
    const days = byStudent.get(row.studentId) ?? []
    let day = days.find((item) => item.date === row.observedAt)
    if (!day) {
      day = { date: row.observedAt, scores: {}, note: row.note }
      days.push(day)
    }
    if (row.indicator && row.frequency) {
      day.scores[row.indicator] = row.frequency
    }
    byStudent.set(row.studentId, days)
  }
  return byStudent
}

export async function getActiveAiSummaries(
  tenant: Tenant,
  classId: string,
  weekStart: string,
): Promise<Array<AiSummaryListItem>> {
  const rows = await getDb()
    .select({
      id: aiSummaries.id,
      studentId: aiSummaries.studentId,
      studentName: students.name,
      weekStart: aiSummaries.weekStart,
      content: aiSummaries.content,
      createdAt: aiSummaries.createdAt,
    })
    .from(aiSummaries)
    .innerJoin(students, eq(aiSummaries.studentId, students.id))
    .where(
      and(
        eq(aiSummaries.schoolId, tenant.id),
        eq(aiSummaries.classId, classId),
        eq(aiSummaries.weekStart, weekStart),
        eq(aiSummaries.status, 'active'),
      ),
    )
    .orderBy(asc(students.name))

  return rows.map((row) => ({
    id: row.id,
    studentId: row.studentId,
    studentName: row.studentName,
    weekStart: row.weekStart,
    content: row.content,
    createdLabel: formatIndonesianDate(row.createdAt),
  }))
}

export async function getActiveSummaryStudentIds(
  tenant: Tenant,
  weekStart: string,
  studentIds: Array<string>,
): Promise<Set<string>> {
  if (!studentIds.length) return new Set()
  const rows = await getDb()
    .select({ studentId: aiSummaries.studentId })
    .from(aiSummaries)
    .where(
      and(
        eq(aiSummaries.schoolId, tenant.id),
        eq(aiSummaries.weekStart, weekStart),
        eq(aiSummaries.status, 'active'),
        inArray(aiSummaries.studentId, studentIds),
      ),
    )
  return new Set(rows.map((row) => row.studentId))
}

export async function getClassWeeklyNote(
  tenant: Tenant,
  teacherId: string,
  classId: string,
  weekStart: string,
) {
  const note = await getDb().query.weeklyNotes.findFirst({
    where: and(
      eq(weeklyNotes.schoolId, tenant.id),
      eq(weeklyNotes.teacherId, teacherId),
      eq(weeklyNotes.classId, classId),
      eq(weeklyNotes.weekStart, weekStart),
    ),
  })
  return note ? { p1: note.p1, p2: note.p2, p3: note.p3 } : null
}

export async function getAiGenerationHistory(
  tenant: Tenant,
): Promise<Array<AiGenerationHistoryEntry>> {
  const rows = await getDb()
    .select({
      id: aiGenerationLogs.id,
      createdAt: aiGenerationLogs.createdAt,
      weekStart: aiGenerationLogs.weekStart,
      className: classes.name,
      studentCount: aiGenerationLogs.studentCount,
      promptTokens: aiGenerationLogs.promptTokens,
      cachedTokens: aiGenerationLogs.cachedTokens,
      completionTokens: aiGenerationLogs.completionTokens,
      costUsd: aiGenerationLogs.costUsd,
    })
    .from(aiGenerationLogs)
    .leftJoin(classes, eq(aiGenerationLogs.classId, classes.id))
    .where(eq(aiGenerationLogs.schoolId, tenant.id))
    .orderBy(desc(aiGenerationLogs.createdAt))
    .limit(200)

  return rows.map((row) => ({
    ...row,
    createdLabel: dateTimeFormatter.format(row.createdAt),
  }))
}

export type ParentAiSummary = {
  id: string
  weekStart: string
  weekLabel: string
  content: string
}

export function weekRangeLabel(weekStart: string) {
  const startLabel = formatIndonesianDate(weekStart).replace(/ \d{4}$/, '')
  return `${startLabel} – ${formatIndonesianDate(addDaysIso(weekStart, 4))}`
}

export async function getActiveAiSummariesForStudent(
  studentId: string,
): Promise<Array<ParentAiSummary>> {
  const rows = await getDb().query.aiSummaries.findMany({
    where: and(
      eq(aiSummaries.studentId, studentId),
      eq(aiSummaries.status, 'active'),
    ),
    orderBy: [desc(aiSummaries.weekStart)],
  })

  return rows.map((row) => ({
    id: row.id,
    weekStart: row.weekStart,
    weekLabel: weekRangeLabel(row.weekStart),
    content: row.content,
  }))
}
