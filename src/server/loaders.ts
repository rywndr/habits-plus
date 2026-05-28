import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { schools, users } from '#/db/schema'
import type { Role } from '#/db/schema'
import {
  getAdminDashboard,
  getDailyObservationDay,
  getGuruDashboard,
  getLatestSummary,
  getMonthlySummary,
  getParentProgress,
  getTenantBySlug,
  getTenantClasses,
  getTenantStudents,
  getTenantUsers,
  getWeeklyNotes,
  withTenantCache,
} from './tenant-data'
import type { Tenant } from './tenant-data'
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

export const loadCurrentUser = createServerFn({ method: 'GET' })
  .inputValidator((data: CurrentUserInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      return getAuthenticatedUserByRole(data.role)
    }),
  )

async function resolveTenant(input?: TenantInput): Promise<Tenant> {
  if (input?.tenant) return getTenantBySlug(input.tenant)

  const { getSession } = await import('./auth.server')
  const session = await getSession()

  if (!session) {
    throw new Error('Silakan masuk terlebih dahulu.')
  }

  const user = await getDb().query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  if (!user) {
    throw new Error('Silakan masuk terlebih dahulu.')
  }

  return getTenantBySlug(user.tenantSlug)
}

export const loadTenantUsers = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => getTenantUsers(await resolveTenant(data))),
  )

export const loadSuperAdminSchools = createServerFn({ method: 'GET' }).handler(
  () =>
    withTenantCache(async (): Promise<Array<SuperAdminSchool>> => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      await getAuthenticatedUserByRole('super-admin')

      const [schoolRows, userRows] = await Promise.all([
        getDb().query.schools.findMany({
          orderBy: [asc(schools.name)],
        }),
        getDb().query.users.findMany({
          where: eq(users.role, 'admin'),
        }),
      ])

      return schoolRows
        .filter((school) => school.slug !== 'platform')
        .map((school) => {
          const admins = userRows.filter((user) => user.schoolId === school.id)

          return {
            id: school.id,
            slug: school.slug,
            name: school.name,
            region: school.region,
            adminCount: admins.length,
            adminEmails: admins.map((admin) => admin.email),
          }
        })
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

      const schoolRows = await loadSuperAdminSchools()
      const adminRows = await getDb().query.users.findMany({
        where: eq(users.role, 'admin'),
        orderBy: [asc(users.name)],
      })

      return {
        schools: schoolRows,
        admins: adminRows
          .map((admin) => {
            const school = schoolRows.find((row) => row.id === admin.schoolId)

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

export const loadTenantClasses = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => getTenantClasses(await resolveTenant(data))),
  )

export const loadTenantStudents = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => getTenantStudents(await resolveTenant(data))),
  )

export const loadAdminDashboard = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => getAdminDashboard(await resolveTenant(data))),
  )

export const loadGuruDashboard = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')

      return getGuruDashboard(await resolveTenant(data), teacher.id)
    }),
  )

export const loadLatestSummary = createServerFn({ method: 'GET' })
  .inputValidator((data: MonthlySummaryInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
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
      const tenant = await resolveTenant(data)
      let parentId = data.parentId

      if (!parentId) {
        const { getAuthenticatedUserByRole } = await import('./auth.server')
        const parent = await getAuthenticatedUserByRole('ortu')
        parentId = parent.id
      }

      return getParentProgress(tenant, parentId)
    }),
  )

export const loadWeeklyNotes = createServerFn({ method: 'GET' })
  .inputValidator((data: WeeklyNotesInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const tenant = await resolveTenant(data)
      const teacher = await getAuthenticatedUserByRole('guru')
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

export const loadObservationPage = createServerFn({ method: 'GET' })
  .inputValidator((data: ObservationPageInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
      const observedAt = data.observedAt || todayIso()
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
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
