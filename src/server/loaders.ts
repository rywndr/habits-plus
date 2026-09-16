import { createServerFn } from '@tanstack/react-start'
import { and, asc, between, count, eq, inArray, ne } from 'drizzle-orm'
import { getDb } from '#/db'
import {
  classes as classTable,
  dailyObservations,
  observationScores,
  schools,
  students as studentTable,
  users,
  weeklyNotes as weeklyNotesTable,
} from '#/db/schema'
import type { Role } from '#/db/schema'
import {
  getActiveAiSummaries,
  getAdminDashboard,
  getAiGenerationHistory,
  getClassWeekObservations,
  getDailyAvailability,
  getDailyObservationDay,
  getGuruDashboard,
  getMonthlySummary,
  getParentProgress,
  getReportWeekAvailability,
  getTenantClasses,
  getTenantStudents,
  getTenantUsers,
  getWeeklyNotes,
  getMonthlyAvailability,
  withTenantCache,
} from './tenant-data'
import type {
  AiSummaryListItem,
  Frequency,
  MonthlySummary,
  StudentWeekDayData,
} from './tenant-data'
import { todayIso, weekStartIso } from './date'
import { resolveSelectedClassId } from '#/lib/class-selection'
import { buildPeriodAvailability } from '#/lib/period-availability'

import {
  currentUserSchema,
  aiCostHistorySchema,
  monthlySummarySchema,
  weeklyNotesSchema,
  exportRangeSchema,
  observationPageSchema,
  parentReportPageSchema,
} from './loader-schemas'

export type SuperAdminSchool = {
  id: string
  slug: string
  name: string
  region: string
  adminCount: number
  adminEmails: Array<string>
}

export type SuperAdminSchoolAdmin = {
  id: string
  schoolId: string
  schoolName: string
  name: string
  email: string
}

export type DailyObservationExportRow = {
  observedAt: string
  classId: string
  className: string
  studentId: string
  studentName: string
  nisn: string
  note: string
  respons: Frequency | ''
  interaksi: Frequency | ''
  partisipasi: Frequency | ''
  regulasi: Frequency | ''
}

export type WeeklyNoteExportRow = {
  weekStart: string
  classId: string | null
  className: string | null
  p1: string
  p2: string
  p3: string
}

export const loadSessionRole = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Role | null> => {
    const { getSession } = await import('./auth.server')
    const session = await getSession()
    return (session?.user.role as Role | undefined) ?? null
  },
)

export const loadCurrentUser = createServerFn({ method: 'GET' })
  .validator(currentUserSchema)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      return getAuthenticatedUserByRole(data.role)
    }),
  )

export const loadTenantUsers = createServerFn({ method: 'GET' }).handler(() =>
  withTenantCache(async () => {
    const { getAuthenticatedUserByRole } = await import('./auth.server')
    const admin = await getAuthenticatedUserByRole('admin')
    return getTenantUsers(admin.tenant)
  }),
)

async function fetchSuperAdminSchools() {
  const [schoolRows, adminRows] = await Promise.all([
    getDb().query.schools.findMany({
      orderBy: [asc(schools.name)],
    }),
    getDb().query.users.findMany({
      where: eq(users.role, 'admin'),
      orderBy: [asc(users.name)],
    }),
  ])

  const schoolList: Array<SuperAdminSchool> = schoolRows
    .filter((school) => school.slug !== 'platform')
    .map((school) => {
      const admins = adminRows.filter((user) => user.schoolId === school.id)

      return {
        id: school.id,
        slug: school.slug,
        name: school.name,
        region: school.region,
        adminCount: admins.length,
        adminEmails: admins.map((admin) => admin.email),
      }
    })

  return { schools: schoolList, adminRows }
}

export const loadSuperAdminSchools = createServerFn({ method: 'GET' }).handler(
  () =>
    withTenantCache(async (): Promise<Array<SuperAdminSchool>> => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      await getAuthenticatedUserByRole('super-admin')

      return (await fetchSuperAdminSchools()).schools
    }),
)

export const loadSuperAdminDashboard = createServerFn({
  method: 'GET',
}).handler(() =>
  withTenantCache(async (): Promise<{ tenantCount: number }> => {
    const { getAuthenticatedUserByRole } = await import('./auth.server')
    await getAuthenticatedUserByRole('super-admin')

    const [tenantCount] = await getDb()
      .select({ value: count() })
      .from(schools)
      .where(ne(schools.slug, 'platform'))

    return {
      tenantCount: tenantCount.value,
    }
  }),
)

export const loadSuperAdminSchoolAdmins = createServerFn({
  method: 'GET',
}).handler(() =>
  withTenantCache(
    async (): Promise<{
      schools: Array<SuperAdminSchool>
      admins: Array<SuperAdminSchoolAdmin>
    }> => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      await getAuthenticatedUserByRole('super-admin')

      const { schools: schoolList, adminRows } = await fetchSuperAdminSchools()

      return {
        schools: schoolList,
        admins: adminRows
          .map((admin) => {
            const school = schoolList.find((row) => row.id === admin.schoolId)

            if (!school) return null

            return {
              id: admin.id,
              schoolId: admin.schoolId,
              schoolName: school.name,
              name: admin.name,
              email: admin.email,
            }
          })
          .filter((admin): admin is SuperAdminSchoolAdmin => admin !== null),
      }
    },
  ),
)

export const loadTenantClasses = createServerFn({ method: 'GET' }).handler(() =>
  withTenantCache(async () => {
    const { getAuthenticatedUserByRole } = await import('./auth.server')
    const admin = await getAuthenticatedUserByRole('admin')
    return getTenantClasses(admin.tenant)
  }),
)

export const loadTenantStudents = createServerFn({ method: 'GET' }).handler(
  () =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const admin = await getAuthenticatedUserByRole('admin')
      return getTenantStudents(admin.tenant)
    }),
)

export const loadAiCostHistory = createServerFn({ method: 'GET' })
  .validator(aiCostHistorySchema)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const admin = await getAuthenticatedUserByRole('admin')
      const selectedWeekStart = weekStartIso(
        data.weekStart ? new Date(data.weekStart) : new Date(),
      )
      const classes = await getTenantClasses(admin.tenant)
      const classId = classes.find((item) => item.id === data.classId)?.id ?? ''

      return {
        classes,
        classId,
        selectedWeekStart,
        history: await getAiGenerationHistory(admin.tenant, {
          classId: classId || undefined,
          weekStart: selectedWeekStart,
        }),
      }
    }),
  )

export const loadAdminDashboard = createServerFn({ method: 'GET' }).handler(
  () =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const admin = await getAuthenticatedUserByRole('admin')
      return getAdminDashboard(admin.tenant)
    }),
)

export const loadGuruDashboard = createServerFn({ method: 'GET' }).handler(() =>
  withTenantCache(async () => {
    const { getAuthenticatedUserByRole } = await import('./auth.server')
    const teacher = await getAuthenticatedUserByRole('guru')
    return getGuruDashboard(teacher.tenant, teacher.id)
  }),
)

export const loadLatestSummary = createServerFn({ method: 'GET' })
  .validator(monthlySummarySchema)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      const tenant = teacher.tenant
      const classes = await getTenantClasses(tenant, teacher.id)
      const classId = resolveSelectedClassId(classes, data.classId)
      const month = data.month ?? todayIso().slice(0, 7)
      const emptySummary: MonthlySummary = {
        month,
        monthLabel: '',
        text: '',
        trends: {},
        averages: {},
        radar: [],
      }
      const summary = classId
        ? await getMonthlySummary(tenant, month, teacher.id, classId)
        : emptySummary

      const availability = classId
        ? await getMonthlyAvailability(tenant, teacher.id, classId, month)
        : buildPeriodAvailability({
            selectedPeriod: month,
            selectedHasData: false,
            populatedPeriods: [],
          })

      return { ...summary, classes, classId, availability }
    }),
  )

export const loadParentProgress = createServerFn({ method: 'GET' }).handler(
  () =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const parent = await getAuthenticatedUserByRole('ortu')
      return getParentProgress(parent.tenant, parent.id)
    }),
)

export const loadWeeklyNotes = createServerFn({ method: 'GET' })
  .validator(weeklyNotesSchema)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      const tenant = teacher.tenant
      const classes = await getTenantClasses(tenant, teacher.id)
      const classId = resolveSelectedClassId(classes, data.classId)
      const notes = classId
        ? await getWeeklyNotes(tenant, teacher.id, classId)
        : []
      const selectedWeekStart = weekStartIso(
        data.weekStart ? new Date(data.weekStart) : new Date(),
      )

      return {
        notes,
        classes,
        classId,
        selectedWeekStart,
        selectedNote: classId
          ? (notes.find((note) => note.date === selectedWeekStart) ?? null)
          : null,
        availability: buildPeriodAvailability({
          selectedPeriod: selectedWeekStart,
          selectedHasData: notes.some(
            (note) => note.date === selectedWeekStart,
          ),
          populatedPeriods: notes.map((note) => note.date),
        }),
      }
    }),
  )

export const loadDailyObservationExport = createServerFn({ method: 'GET' })
  .validator(exportRangeSchema)
  .handler(({ data }) =>
    withTenantCache(async (): Promise<Array<DailyObservationExportRow>> => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      const tenant = teacher.tenant
      const teacherClasses = await getTenantClasses(tenant, teacher.id)
      const allowedClassIds = teacherClasses.map((item) => item.id)
      const classIds =
        data.classId && data.classId !== 'all'
          ? allowedClassIds.filter((id) => id === data.classId)
          : allowedClassIds

      if (!classIds.length) return []

      const rows = await getDb()
        .select({
          observationId: dailyObservations.id,
          observedAt: dailyObservations.observedAt,
          note: dailyObservations.note,
          classId: classTable.id,
          className: classTable.name,
          studentId: studentTable.id,
          studentName: studentTable.name,
          nisn: studentTable.nisn,
          indicator: observationScores.indicator,
          frequency: observationScores.frequency,
        })
        .from(dailyObservations)
        .innerJoin(
          studentTable,
          eq(dailyObservations.studentId, studentTable.id),
        )
        .innerJoin(classTable, eq(studentTable.classId, classTable.id))
        .leftJoin(
          observationScores,
          eq(observationScores.observationId, dailyObservations.id),
        )
        .where(
          and(
            eq(dailyObservations.schoolId, tenant.id),
            inArray(classTable.id, classIds),
            between(dailyObservations.observedAt, data.startDate, data.endDate),
          ),
        )
        .orderBy(
          asc(dailyObservations.observedAt),
          asc(classTable.name),
          asc(studentTable.name),
        )

      const grouped = new Map<string, DailyObservationExportRow>()

      for (const row of rows) {
        const existing =
          grouped.get(row.observationId) ??
          ({
            observedAt: row.observedAt,
            classId: row.classId,
            className: row.className,
            studentId: row.studentId,
            studentName: row.studentName,
            nisn: row.nisn,
            note: row.note ?? '',
            respons: '',
            interaksi: '',
            partisipasi: '',
            regulasi: '',
          } satisfies DailyObservationExportRow)

        if (row.indicator) {
          existing[row.indicator] = row.frequency ?? ''
        }

        grouped.set(row.observationId, existing)
      }

      return Array.from(grouped.values())
    }),
  )

export const loadWeeklyNotesExport = createServerFn({ method: 'GET' })
  .validator(exportRangeSchema)
  .handler(({ data }) =>
    withTenantCache(async (): Promise<Array<WeeklyNoteExportRow>> => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      const tenant = teacher.tenant
      const teacherClasses = await getTenantClasses(tenant, teacher.id)
      const allowedClassIds = teacherClasses.map((item) => item.id)
      const classFilters =
        data.classId && data.classId !== 'all'
          ? allowedClassIds.filter((id) => id === data.classId)
          : allowedClassIds

      if (!classFilters.length) return []

      const rows = await getDb()
        .select({
          weekStart: weeklyNotesTable.weekStart,
          classId: weeklyNotesTable.classId,
          className: classTable.name,
          p1: weeklyNotesTable.p1,
          p2: weeklyNotesTable.p2,
          p3: weeklyNotesTable.p3,
        })
        .from(weeklyNotesTable)
        .leftJoin(classTable, eq(weeklyNotesTable.classId, classTable.id))
        .where(
          and(
            eq(weeklyNotesTable.schoolId, tenant.id),
            eq(weeklyNotesTable.teacherId, teacher.id),
            inArray(weeklyNotesTable.classId, classFilters),
            between(weeklyNotesTable.weekStart, data.startDate, data.endDate),
          ),
        )
        .orderBy(asc(weeklyNotesTable.weekStart), asc(classTable.name))

      return rows
    }),
  )

export const loadObservationPage = createServerFn({ method: 'GET' })
  .validator(observationPageSchema)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      const tenant = teacher.tenant
      const observedAt = data.observedAt || todayIso()
      const classes = await getTenantClasses(tenant, teacher.id)
      const classIds = classes.map((item) => item.id)
      const classId = resolveSelectedClassId(classes, data.classId)
      const [students, observationDay, availability] = await Promise.all([
        getTenantStudents(tenant, classIds),
        classId
          ? getDailyObservationDay(tenant, classId, observedAt)
          : Promise.resolve({ rows: [], note: '' }),
        classId
          ? getDailyAvailability(tenant, classId, observedAt)
          : Promise.resolve({
              ...buildPeriodAvailability({
                selectedPeriod: observedAt,
                selectedHasData: false,
                populatedPeriods: [],
              }),
              populatedDates: [],
            }),
      ])

      return {
        classes,
        students,
        rows: observationDay.rows,
        note: observationDay.note,
        observedAt,
        classId,
        availability,
      }
    }),
  )

export const loadParentReportPage = createServerFn({ method: 'GET' })
  .validator(parentReportPageSchema)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      const tenant = teacher.tenant
      const selectedWeekStart = weekStartIso(
        data.weekStart ? new Date(data.weekStart) : new Date(),
      )
      const classes = await getTenantClasses(tenant, teacher.id)
      const classId = resolveSelectedClassId(classes, data.classId)

      if (!classId) {
        const weekData: Record<string, Array<StudentWeekDayData>> = {}
        const summaries: Array<AiSummaryListItem> = []
        return {
          classes,
          classId,
          selectedWeekStart,
          students: [],
          weekData,
          summaries,
          availability: buildPeriodAvailability({
            selectedPeriod: selectedWeekStart,
            selectedHasData: false,
            populatedPeriods: [],
          }),
        }
      }

      const [students, weekObservations, summaries, availability] =
        await Promise.all([
          getTenantStudents(tenant, [classId]),
          getClassWeekObservations(tenant, classId, selectedWeekStart),
          getActiveAiSummaries(tenant, classId, selectedWeekStart),
          getReportWeekAvailability(tenant, classId, selectedWeekStart),
        ])
      const activeIds = new Set(summaries.map((item) => item.studentId))

      return {
        classes,
        classId,
        selectedWeekStart,
        students: students.map((student) => ({
          id: student.id,
          name: student.name,
          nisn: student.nisn,
          gender: student.gender,
          observedDays: weekObservations.get(student.id)?.length ?? 0,
          hasActiveSummary: activeIds.has(student.id),
        })),
        weekData: Object.fromEntries(weekObservations),
        summaries,
        availability: {
          ...availability,
          selectedHasData: weekObservations.size > 0 || summaries.length > 0,
        },
      }
    }),
  )
