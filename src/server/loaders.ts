import { createServerFn } from '@tanstack/react-start'
import { and, asc, between, eq, inArray } from 'drizzle-orm'
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
  getDailyObservationDay,
  getGuruDashboard,
  getLatestSummary,
  getMonthlySummary,
  getParentProgress,
  getTenantClasses,
  getTenantStudents,
  getTenantUsers,
  getWeeklyNotes,
  withTenantCache,
} from './tenant-data'
import type {
  AiGenerationHistoryEntry,
  AiSummaryListItem,
  StudentWeekDayData,
} from './tenant-data'
import { todayIso, weekStartIso } from './date'

type TenantInput = {
  tenant?: string
}

type ObservationPageInput = TenantInput & {
  classId?: string
  observedAt?: string
}

type MonthlySummaryInput = TenantInput & {
  month?: string
  classId?: string
}

type WeeklyNotesInput = TenantInput & {
  weekStart?: string
  classId?: string
}

type ExportRangeInput = TenantInput & {
  startDate: string
  endDate: string
  classId?: string
}

type CurrentUserInput = TenantInput & {
  role: Role
}

type ParentProgressInput = TenantInput & {
  parentId?: string
}

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
  respons: string
  interaksi: string
  partisipasi: string
  regulasi: string
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
  .inputValidator((data: CurrentUserInput) => data)
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
  .inputValidator((data: MonthlySummaryInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      const tenant = teacher.tenant
      const classId =
        data.classId && data.classId !== 'all' ? data.classId : undefined
      const [classes, summary] = await Promise.all([
        getTenantClasses(tenant, teacher.id),
        data.month
          ? getMonthlySummary(tenant, data.month, teacher.id, classId)
          : getLatestSummary(tenant, teacher.id, classId),
      ])

      return { ...summary, classes, classId: classId ?? 'all' }
    }),
  )

export const loadParentProgress = createServerFn({ method: 'GET' })
  .inputValidator((data: ParentProgressInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const parent = await getAuthenticatedUserByRole('ortu')
      const tenant = parent.tenant
      return getParentProgress(tenant, data.parentId ?? parent.id)
    }),
  )

export const loadWeeklyNotes = createServerFn({ method: 'GET' })
  .inputValidator((data: WeeklyNotesInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      const tenant = teacher.tenant
      const classId =
        data.classId && data.classId !== 'all' ? data.classId : undefined
      const [classes, notes] = await Promise.all([
        getTenantClasses(tenant, teacher.id),
        getWeeklyNotes(tenant, teacher.id, classId),
      ])
      const selectedWeekStart = weekStartIso(
        data.weekStart ? new Date(data.weekStart) : new Date(),
      )

      return {
        notes,
        classes,
        classId: classId ?? 'all',
        selectedWeekStart,
        // Notes are per class, so the editor only targets a note when a
        // specific class is selected ("Semua kelas" is a read-only overview).
        selectedNote: classId
          ? (notes.find((note) => note.date === selectedWeekStart) ?? null)
          : null,
      }
    }),
  )

export const loadDailyObservationExport = createServerFn({ method: 'GET' })
  .inputValidator((data: ExportRangeInput) => data)
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
  .inputValidator((data: ExportRangeInput) => data)
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
  .inputValidator((data: ObservationPageInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      const tenant = teacher.tenant
      const observedAt = data.observedAt || todayIso()
      const classes = await getTenantClasses(tenant, teacher.id)
      const classIds = classes.map((item) => item.id)

      const [students, eagerObservation] = await Promise.all([
        getTenantStudents(tenant, classIds),
        data.classId
          ? getDailyObservationDay(tenant, data.classId, observedAt)
          : Promise.resolve(null),
      ])

      const requestedClass = classes.find((item) => item.id === data.classId)
      const classWithStudents = classes.find((item) =>
        students.some((student) => student.classId === item.id),
      )
      const classId =
        requestedClass?.id || classWithStudents?.id || classes[0]?.id || ''

      const observationDay =
        eagerObservation && data.classId === classId
          ? eagerObservation
          : classId
            ? await getDailyObservationDay(tenant, classId, observedAt)
            : { rows: [], note: '' }

      return {
        classes,
        students,
        rows: observationDay.rows,
        note: observationDay.note,
        observedAt,
        classId,
      }
    }),
  )

type AiSummaryPageInput = TenantInput & {
  weekStart?: string
  classId?: string
}

export const loadAiSummaryPage = createServerFn({ method: 'GET' })
  .inputValidator((data: AiSummaryPageInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      const tenant = teacher.tenant
      const selectedWeekStart = weekStartIso(
        data.weekStart ? new Date(data.weekStart) : new Date(),
      )
      const classes = await getTenantClasses(tenant, teacher.id)
      const classId =
        classes.find((item) => item.id === data.classId)?.id ||
        classes[0]?.id ||
        ''

      if (!classId) {
        const weekData: Record<string, Array<StudentWeekDayData>> = {}
        const summaries: Array<AiSummaryListItem> = []
        const history: Array<AiGenerationHistoryEntry> = []
        return {
          classes,
          classId,
          selectedWeekStart,
          students: [],
          weekData,
          summaries,
          history,
        }
      }

      const [students, weekObservations, summaries, history] =
        await Promise.all([
          getTenantStudents(tenant, [classId]),
          getClassWeekObservations(tenant, classId, selectedWeekStart),
          getActiveAiSummaries(tenant, classId, selectedWeekStart),
          getAiGenerationHistory(tenant),
        ])
      const activeIds = new Set(summaries.map((item) => item.studentId))

      return {
        classes,
        classId,
        selectedWeekStart,
        students: students.map((student) => ({
          id: student.id,
          name: student.name,
          gender: student.gender,
          observedDays: weekObservations.get(student.id)?.length ?? 0,
          hasActiveSummary: activeIds.has(student.id),
        })),
        weekData: Object.fromEntries(weekObservations),
        summaries,
        history,
      }
    }),
  )
