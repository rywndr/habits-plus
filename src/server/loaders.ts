import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { users } from '#/db/schema'
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
}

type WeeklyNotesInput = TenantInput & {
  weekStart?: string
}

type CurrentUserInput = TenantInput & {
  role: Role
}

type ParentProgressInput = TenantInput & {
  parentId?: string
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
    withTenantCache(async () => getGuruDashboard(await resolveTenant(data))),
  )

export const loadLatestSummary = createServerFn({ method: 'GET' })
  .inputValidator((data: MonthlySummaryInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
      return data.month
        ? getMonthlySummary(tenant, data.month)
        : getLatestSummary(tenant)
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
      const notes = await getWeeklyNotes(await resolveTenant(data))
      const selectedWeekStart = weekStartIso(
        data.weekStart ? new Date(data.weekStart) : new Date(),
      )

      return {
        notes,
        selectedWeekStart,
        selectedNote:
          notes.find((note) => note.date === selectedWeekStart) ?? null,
      }
    }),
  )

export const loadObservationPage = createServerFn({ method: 'GET' })
  .inputValidator((data: ObservationPageInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
      const observedAt = data.observedAt || todayIso()

      const [classes, students, eagerObservation] = await Promise.all([
        getTenantClasses(tenant),
        getTenantStudents(tenant),
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
