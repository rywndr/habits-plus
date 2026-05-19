import { and, eq, gte, lt } from 'drizzle-orm'
import { getDb } from '#/db'
import {
  dailyObservations,
  frequencyScore,
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
import { getWeeklyNotes } from './weekly-notes'
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
  const [notes, observationRows] = await Promise.all([
    getWeeklyNotes(slug).then((items) =>
      items.filter((note) => note.date >= start && note.date < end),
    ),
    getDb()
      .select({
        indicator: observationScores.indicator,
        frequency: observationScores.frequency,
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
  const trends: Partial<Record<Indicator, Trend>> = Object.fromEntries(
    (['respons', 'interaksi', 'partisipasi', 'regulasi'] as const).map(
      (indicator) => {
        const summary = averageByIndicator[indicator]
        const average = summary ? summary.total / summary.count : 0
        const frequency =
          scoreFrequency[Math.max(0, Math.min(2, Math.round(average)))]
        const trendByFrequency: Record<Frequency, Trend> = {
          'tidak-terlihat': 'tidak-terlihat',
          'terlihat-sesekali': 'stabil',
          sering: 'meningkat',
        }

        return [indicator, trendByFrequency[frequency]]
      },
    ),
  )

  return {
    month: start.slice(0, 7),
    monthLabel: formatIndonesianMonth(start),
    text: notes.length
      ? notes.map((note) => `${note.p1} ${note.p2} ${note.p3}`).join(' ')
      : `Belum ada catatan mingguan untuk ${formatIndonesianMonth(start)}.`,
    trends,
  }
}

export async function getLatestSummary(slug: string): Promise<MonthlySummary> {
  const latestNote = (await getWeeklyNotes(slug))[0]
  const month =
    latestNote?.date.slice(0, 7) ?? new Date().toISOString().slice(0, 7)

  return getMonthlySummary(slug, month)
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
