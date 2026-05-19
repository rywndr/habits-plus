import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { users } from '#/db/schema'
import type { Role } from '#/db/schema'
import {
  getAdminDashboard,
  getDailyObservationRows,
  getGuruDashboard,
  getLatestSummary,
  getParentProgress,
  getTenantClasses,
  getTenantStudents,
  getTenantUsers,
  getWeeklyNotes,
} from './tenant-data'
import { todayIso } from './date'

type TenantInput = {
  tenant?: string
}

type CurrentUserInput = TenantInput & {
  role: Role
}

type ParentProgressInput = TenantInput & {
  parentId?: string
}

export const loadCurrentUser = createServerFn({ method: 'GET' })
  .inputValidator((data: CurrentUserInput) => data)
  .handler(async ({ data }) => {
    const { getAuthenticatedUserByRole } = await import('./auth.server')

    return getAuthenticatedUserByRole(data.role)
  })

async function resolveTenant(input?: TenantInput) {
  if (input?.tenant) return input.tenant

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

  return user.tenantSlug
}

export const loadTenantUsers = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(async ({ data }) => getTenantUsers(await resolveTenant(data)))

export const loadTenantClasses = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(async ({ data }) => getTenantClasses(await resolveTenant(data)))

export const loadTenantStudents = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(async ({ data }) => getTenantStudents(await resolveTenant(data)))

export const loadAdminDashboard = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(async ({ data }) => getAdminDashboard(await resolveTenant(data)))

export const loadGuruDashboard = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(async ({ data }) => getGuruDashboard(await resolveTenant(data)))

export const loadLatestSummary = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(async ({ data }) => getLatestSummary(await resolveTenant(data)))

export const loadParentProgress = createServerFn({ method: 'GET' })
  .inputValidator((data: ParentProgressInput) => data)
  .handler(async ({ data }) => {
    const tenant = await resolveTenant(data)
    let parentId = data.parentId

    if (!parentId) {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const parent = await getAuthenticatedUserByRole('ortu')
      parentId = parent.id
    }

    return getParentProgress(tenant, parentId)
  })

export const loadWeeklyNotes = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(async ({ data }) => getWeeklyNotes(await resolveTenant(data)))

export const loadObservationPage = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(async ({ data }) => {
    const tenant = await resolveTenant(data)
    const classes = await getTenantClasses(tenant)
    const classId = classes[0]?.id ?? ''
    const [students, rows] = await Promise.all([
      getTenantStudents(tenant),
      classId ? getDailyObservationRows(tenant, classId) : [],
    ])

    return { classes, students, rows, observedAt: todayIso() }
  })
