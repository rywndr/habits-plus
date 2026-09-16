import { and, desc, eq, gte, lt } from 'drizzle-orm'
import { getDb } from '#/db'
import {
  aiSummaries,
  dailyObservations,
  monthlySummaries,
  students,
} from '#/db/schema'
import { buildPeriodAvailability } from '#/lib/period-availability'
import { monthStartIso, nextMonthStartIso, weekStartIso } from '../date'
import type { PeriodAvailability } from '#/lib/period-availability'
import type { Tenant } from './types'

const RECENT_PERIOD_LIMIT = 8

export function observationMonthRange(month: string) {
  return {
    start: monthStartIso(month),
    end: nextMonthStartIso(month),
  }
}

export async function getDailyAvailabilityForMonth(
  tenant: Tenant,
  classId: string,
  month: string,
) {
  const range = observationMonthRange(month)
  const rows = await getDb()
    .selectDistinct({ period: dailyObservations.observedAt })
    .from(dailyObservations)
    .innerJoin(students, eq(dailyObservations.studentId, students.id))
    .where(
      and(
        eq(dailyObservations.schoolId, tenant.id),
        eq(students.classId, classId),
        gte(dailyObservations.observedAt, range.start),
        lt(dailyObservations.observedAt, range.end),
      ),
    )

  return rows.map((row) => row.period)
}

async function getRecentObservationDates(
  tenant: Tenant,
  classId: string,
  limit: number,
) {
  return getDb()
    .selectDistinct({ period: dailyObservations.observedAt })
    .from(dailyObservations)
    .innerJoin(students, eq(dailyObservations.studentId, students.id))
    .where(
      and(
        eq(dailyObservations.schoolId, tenant.id),
        eq(students.classId, classId),
      ),
    )
    .orderBy(desc(dailyObservations.observedAt))
    .limit(limit)
}

export async function getDailyAvailability(
  tenant: Tenant,
  classId: string,
  selectedDate: string,
): Promise<PeriodAvailability & { populatedDates: Array<string> }> {
  const [recentRows, monthRows] = await Promise.all([
    getRecentObservationDates(tenant, classId, RECENT_PERIOD_LIMIT),
    getDailyAvailabilityForMonth(tenant, classId, selectedDate.slice(0, 7)),
  ])
  const populatedDates = monthRows

  return {
    ...buildPeriodAvailability({
      selectedPeriod: selectedDate,
      selectedHasData: populatedDates.includes(selectedDate),
      populatedPeriods: recentRows.map((row) => row.period),
    }),
    populatedDates,
  }
}

export async function getReportWeekAvailability(
  tenant: Tenant,
  classId: string,
  selectedWeek: string,
): Promise<PeriodAvailability> {
  const [observationRows, summaryRows] = await Promise.all([
    getRecentObservationDates(tenant, classId, RECENT_PERIOD_LIMIT * 5),
    getDb()
      .selectDistinct({ period: aiSummaries.weekStart })
      .from(aiSummaries)
      .where(
        and(
          eq(aiSummaries.schoolId, tenant.id),
          eq(aiSummaries.classId, classId),
          eq(aiSummaries.status, 'active'),
        ),
      )
      .orderBy(desc(aiSummaries.weekStart))
      .limit(RECENT_PERIOD_LIMIT),
  ])
  const periods = [
    ...observationRows.map((row) => weekStartIso(new Date(row.period))),
    ...summaryRows.map((row) => row.period),
  ]

  return buildPeriodAvailability({
    selectedPeriod: selectedWeek,
    selectedHasData: periods.includes(selectedWeek),
    populatedPeriods: periods,
  })
}

export async function getMonthlyAvailability(
  tenant: Tenant,
  teacherId: string,
  classId: string,
  selectedMonth: string,
): Promise<PeriodAvailability> {
  const selectedStart = monthStartIso(selectedMonth)
  const selectedEnd = nextMonthStartIso(selectedMonth)
  const [observationRows, summaryRows, selectedObservation] = await Promise.all(
    [
      getRecentObservationDates(tenant, classId, RECENT_PERIOD_LIMIT),
      getDb()
        .selectDistinct({ period: monthlySummaries.monthStart })
        .from(monthlySummaries)
        .where(
          and(
            eq(monthlySummaries.schoolId, tenant.id),
            eq(monthlySummaries.teacherId, teacherId),
            eq(monthlySummaries.classId, classId),
          ),
        )
        .orderBy(desc(monthlySummaries.monthStart))
        .limit(RECENT_PERIOD_LIMIT),
      getDb()
        .select({ period: dailyObservations.observedAt })
        .from(dailyObservations)
        .innerJoin(students, eq(dailyObservations.studentId, students.id))
        .where(
          and(
            eq(dailyObservations.schoolId, tenant.id),
            eq(students.classId, classId),
            gte(dailyObservations.observedAt, selectedStart),
            lt(dailyObservations.observedAt, selectedEnd),
          ),
        )
        .limit(1),
    ],
  )
  const observationMonths = observationRows.map((row) => row.period.slice(0, 7))
  const summaryMonths = summaryRows.map((row) => row.period.slice(0, 7))

  return buildPeriodAvailability({
    selectedPeriod: selectedMonth,
    selectedHasData:
      selectedObservation.length > 0 || summaryMonths.includes(selectedMonth),
    populatedPeriods: [...observationMonths, ...summaryMonths],
  })
}
