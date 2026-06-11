import { and, eq, gte, inArray, lt } from 'drizzle-orm'
import { getDb } from '#/db'
import {
  dailyObservations,
  frequencyScore,
  monthlySummaries,
  observationScores,
  scoreFrequency,
  students,
} from '#/db/schema'
import type { Trend } from '#/data'
import { frequencyLabels, indicatorLabels } from '#/lib/domain'
import { getTenantClasses } from './classes'
import { getTenantStudents } from './students'
import { getTenantUsers } from './users'
import type { Frequency, Indicator, MonthlySummary, Tenant } from './types'
import {
  formatIndonesianMonth,
  monthStartIso,
  nextMonthStartIso,
} from '../date'

export async function getAdminDashboard(tenant: Tenant) {
  const [tenantUsers, tenantClasses, tenantStudents] = await Promise.all([
    getTenantUsers(tenant),
    getTenantClasses(tenant),
    getTenantStudents(tenant),
  ])

  return {
    tenant,
    teachersCount: tenantUsers.filter((user) => user.role === 'guru').length,
    parentsCount: tenantUsers.filter((user) => user.role === 'ortu').length,
    classesCount: tenantClasses.length,
    studentsCount: tenantStudents.length,
  }
}

export async function getGuruDashboard(tenant: Tenant, teacherId: string) {
  const tenantClasses = await getTenantClasses(tenant, teacherId)
  const classIds = tenantClasses.map((klass) => klass.id)
  const [tenantStudents, observationRows] = await Promise.all([
    getTenantStudents(tenant, classIds),
    classIds.length
      ? getDb()
          .select({
            indicator: observationScores.indicator,
            frequency: observationScores.frequency,
          })
          .from(observationScores)
          .innerJoin(
            dailyObservations,
            eq(observationScores.observationId, dailyObservations.id),
          )
          .innerJoin(students, eq(dailyObservations.studentId, students.id))
          .where(
            and(
              eq(dailyObservations.schoolId, tenant.id),
              inArray(students.classId, classIds),
            ),
          )
      : Promise.resolve([]),
  ])

  const distribution = tenantStudents.reduce(
    (acc, student) => {
      if (student.gender === 'L') acc.laki += 1
      else acc.perempuan += 1
      return acc
    },
    { laki: 0, perempuan: 0 },
  )

  const averageByIndicator = observationRows.reduce(
    (acc, row) => {
      const summary = acc[row.indicator] ?? { total: 0, count: 0 }
      summary.total += frequencyScore[row.frequency]
      summary.count += 1
      acc[row.indicator] = summary
      return acc
    },
    {} as Partial<Record<Indicator, { total: number; count: number }>>,
  )

  return {
    kpiStats: (
      ['respons', 'interaksi', 'partisipasi', 'regulasi'] as const
    ).map((indicator) => {
      const summary = averageByIndicator[indicator]
      const average = summary ? summary.total / summary.count : 0
      const score = Math.max(0, Math.min(2, Math.round(average)))
      const frequency = scoreFrequency[score]

      return {
        indicator,
        label: indicatorLabels[indicator],
        frequencyLabel: frequencyLabels[frequency],
      }
    }),
    genderDistribution: distribution,
  }
}

export async function getMonthlySummary(
  tenant: Tenant,
  month: string,
  teacherId?: string,
  classId?: string,
): Promise<MonthlySummary> {
  const start = monthStartIso(month)
  const end = nextMonthStartIso(month)
  const teacherClasses = teacherId
    ? await getTenantClasses(tenant, teacherId)
    : undefined
  const teacherClassIds = teacherClasses?.map((klass) => klass.id)
  // When a specific class is selected, scope to it (only if owned by the
  // teacher). Otherwise ("Semua kelas") aggregate across all teacher classes.
  const classIds =
    classId && teacherClassIds
      ? teacherClassIds.includes(classId)
        ? [classId]
        : []
      : teacherClassIds
  // The manual summary text is per class, so it only exists when one is chosen.
  const summaryPromise = classId
    ? getDb().query.monthlySummaries.findFirst({
        where: and(
          eq(monthlySummaries.schoolId, tenant.id),
          eq(monthlySummaries.monthStart, start),
          eq(monthlySummaries.classId, classId),
          ...(teacherId ? [eq(monthlySummaries.teacherId, teacherId)] : []),
        ),
      })
    : Promise.resolve(undefined)
  const [manualSummary, observationRows] = await Promise.all([
    summaryPromise,
    classIds?.length === 0
      ? Promise.resolve([])
      : getDb()
          .select({
            indicator: observationScores.indicator,
            frequency: observationScores.frequency,
            observedAt: dailyObservations.observedAt,
          })
          .from(observationScores)
          .innerJoin(
            dailyObservations,
            eq(observationScores.observationId, dailyObservations.id),
          )
          .innerJoin(students, eq(dailyObservations.studentId, students.id))
          .where(
            and(
              eq(dailyObservations.schoolId, tenant.id),
              gte(dailyObservations.observedAt, start),
              lt(dailyObservations.observedAt, end),
              ...(classIds ? [inArray(students.classId, classIds)] : []),
            ),
          ),
  ])
  const indicators = [
    'respons',
    'interaksi',
    'partisipasi',
    'regulasi',
  ] as const
  const averageByIndicator = observationRows.reduce(
    (acc, row) => {
      const summary = acc[row.indicator] ?? { total: 0, count: 0 }
      summary.total += frequencyScore[row.frequency]
      summary.count += 1
      acc[row.indicator] = summary
      return acc
    },
    {} as Partial<Record<Indicator, { total: number; count: number }>>,
  )
  const averages: Partial<Record<Indicator, Frequency>> = Object.fromEntries(
    indicators.map((indicator) => {
      const summary = averageByIndicator[indicator]
      const average = summary ? summary.total / summary.count : 0
      const score = Math.max(0, Math.min(2, Math.round(average)))

      return [indicator, scoreFrequency[score]]
    }),
  )
  const trends: Partial<Record<Indicator, Trend>> = Object.fromEntries(
    indicators.map((indicator) => {
      const frequency = averages[indicator] ?? 'tidak-terlihat'
      const trendByFrequency: Record<Frequency, Trend> = {
        'tidak-terlihat': 'tidak-terlihat',
        'terlihat-sesekali': 'stabil',
        sering: 'meningkat',
      }

      return [indicator, trendByFrequency[frequency]]
    }),
  )
  const weekBuckets = Array.from({ length: 4 }, (_, index) => {
    const rows = observationRows.filter((row) => {
      const day = Number(String(row.observedAt).slice(8, 10))
      return Math.min(3, Math.floor((day - 1) / 7)) === index
    })

    return {
      week: `Minggu ke-${index + 1}`,
      values: Object.fromEntries(
        indicators.map((indicator) => {
          const indicatorRows = rows.filter(
            (row) => row.indicator === indicator,
          )
          const total = indicatorRows.reduce(
            (sum, row) => sum + frequencyScore[row.frequency],
            0,
          )
          const average = indicatorRows.length
            ? total / indicatorRows.length
            : 0

          return [indicator, Number(average.toFixed(2))]
        }),
      ) as Record<Indicator, number>,
    }
  })

  return {
    month: start.slice(0, 7),
    monthLabel: formatIndonesianMonth(start),
    text: manualSummary?.text ?? '',
    trends,
    averages,
    radar: weekBuckets,
  }
}

export async function getLatestSummary(
  tenant: Tenant,
  teacherId?: string,
  classId?: string,
): Promise<MonthlySummary> {
  return getMonthlySummary(
    tenant,
    new Date().toISOString().slice(0, 7),
    teacherId,
    classId,
  )
}

export async function getParentProgress(tenant: Tenant, parentId: string) {
  const [child, summary] = await Promise.all([
    getDb().query.students.findFirst({
      where: eq(students.parentId, parentId),
    }),
    getLatestSummary(tenant),
  ])
  // Prefer the teacher-approved AI weekly summary; fall back to the manual
  // monthly summary text when none has been accepted yet.
  const { getLatestActiveAiSummary } = await import('./ai-summaries')
  const aiSummary = child ? await getLatestActiveAiSummary(child.id) : null

  return {
    childName: child?.name ?? 'Anak',
    summaryText: aiSummary?.content ?? summary.text,
    indicators: (
      ['respons', 'interaksi', 'partisipasi', 'regulasi'] as const
    ).map((indicator, index) => ({
      indicator,
      label: indicatorLabels[indicator],
      trend: summary.trends[indicator] ?? 'tidak-terlihat',
      graphic: `/graphics/graphic-${index + 1}.png`,
    })),
  }
}
