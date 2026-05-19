import { and, eq, gte, lt } from 'drizzle-orm'
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
import { getTenantBySlug } from './tenants'
import { getTenantUsers } from './users'
import type { Frequency, Indicator, MonthlySummary } from './types'
import {
  formatIndonesianMonth,
  monthStartIso,
  nextMonthStartIso,
} from '../date'

export async function getAdminDashboard(slug: string) {
  const [tenant, tenantUsers, tenantClasses, tenantStudents] =
    await Promise.all([
      getTenantBySlug(slug),
      getTenantUsers(slug),
      getTenantClasses(slug),
      getTenantStudents(slug),
    ])

  return {
    tenant,
    teachersCount: tenantUsers.filter((user) => user.role === 'guru').length,
    parentsCount: tenantUsers.filter((user) => user.role === 'ortu').length,
    classesCount: tenantClasses.length,
    studentsCount: tenantStudents.length,
  }
}

export async function getGuruDashboard(slug: string) {
  const tenant = await getTenantBySlug(slug)
  const tenantStudents = await getTenantStudents(slug)
  const observationRows = await getDb()
    .select({
      indicator: observationScores.indicator,
      frequency: observationScores.frequency,
    })
    .from(observationScores)
    .innerJoin(
      dailyObservations,
      eq(observationScores.observationId, dailyObservations.id),
    )
    .where(eq(dailyObservations.schoolId, tenant.id))

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
  slug: string,
  month: string,
): Promise<MonthlySummary> {
  const tenant = await getTenantBySlug(slug)
  const start = monthStartIso(month)
  const end = nextMonthStartIso(month)
  const [manualSummary, observationRows] = await Promise.all([
    getDb().query.monthlySummaries.findFirst({
      where: and(
        eq(monthlySummaries.schoolId, tenant.id),
        eq(monthlySummaries.monthStart, start),
      ),
    }),
    getDb()
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
      .where(
        and(
          eq(dailyObservations.schoolId, tenant.id),
          gte(dailyObservations.observedAt, start),
          lt(dailyObservations.observedAt, end),
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
      const day = new Date(row.observedAt).getDate()
      return Math.min(3, Math.floor((day - 1) / 7)) === index
    })

    return {
      week: `Minggu ke-${index + 1}`,
      values: Object.fromEntries(
        indicators.map((indicator) => {
          const indicatorRows = rows.filter((row) => row.indicator === indicator)
          const total = indicatorRows.reduce(
            (sum, row) => sum + frequencyScore[row.frequency],
            0,
          )
          const average = indicatorRows.length ? total / indicatorRows.length : 0

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

export async function getLatestSummary(slug: string): Promise<MonthlySummary> {
  return getMonthlySummary(slug, new Date().toISOString().slice(0, 7))
}

export async function getParentProgress(slug: string, parentId: string) {
  const [child, summary] = await Promise.all([
    getDb().query.students.findFirst({
      where: eq(students.parentId, parentId),
    }),
    getLatestSummary(slug),
  ])

  return {
    childName: child?.name ?? 'Anak',
    summaryText: summary.text,
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
