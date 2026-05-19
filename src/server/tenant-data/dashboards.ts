import { eq } from 'drizzle-orm'
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

export async function getLatestSummary(slug: string): Promise<MonthlySummary> {
  const [notes, dashboard] = await Promise.all([
    getWeeklyNotes(slug),
    getGuruDashboard(slug),
  ])
  const trends: Partial<Record<Indicator, Trend>> = Object.fromEntries(
    dashboard.kpiStats.map((kpi) => {
      const frequency =
        (Object.entries(frequencyLabels).find(
          ([, label]) => label === kpi.frequencyLabel,
        )?.[0] as Frequency | undefined) ?? 'tidak-terlihat'
      const trendByFrequency: Record<Frequency, Trend> = {
        'tidak-terlihat': 'tidak-terlihat',
        'terlihat-sesekali': 'stabil',
        sering: 'meningkat',
      }

      return [kpi.indicator, trendByFrequency[frequency]]
    }),
  )

  return {
    monthLabel: notes[0]?.dateLabel?.replace(/^\d+ /, '') ?? 'Belum ada data',
    text: notes[0]
      ? `${notes[0].p1} ${notes[0].p2} ${notes[0].p3}`
      : 'Belum ada catatan mingguan untuk sekolah ini.',
    trends,
  }
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
