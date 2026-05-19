import { createServerFn } from '@tanstack/react-start'
import type { Role } from '#/db/schema'
import {
  getAdminDashboard,
  getDailyObservationRows,
  getGuruDashboard,
  getLatestSummary,
  getParentProgress,
  getTenantBySlug,
  getTenantClasses,
  getTenantStudents,
  getTenantUsers,
  getWeeklyNotes,
} from './tenant-data'
import { todayIso } from './date'

type TenantInput = {
  tenant: string
}

type CurrentUserInput = TenantInput & {
  role: Role
}

type ObservationRowsInput = TenantInput & {
  classId: string
  observedAt?: string
}

export const loadTenant = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) => getTenantBySlug(data.tenant))

export const loadCurrentUser = createServerFn({ method: 'GET' })
  .inputValidator((data: CurrentUserInput) => data)
  .handler(async ({ data }) => {
    const { getAuthenticatedUser } = await import('./auth.server')

    return getAuthenticatedUser(data.tenant, data.role)
  })

export const loadTenantUsers = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) => getTenantUsers(data.tenant))

export const loadTenantClasses = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) => getTenantClasses(data.tenant))

export const loadTenantStudents = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) => getTenantStudents(data.tenant))

export const loadAdminDashboard = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) => getAdminDashboard(data.tenant))

export const loadGuruDashboard = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) => getGuruDashboard(data.tenant))

export const loadLatestSummary = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) => getLatestSummary(data.tenant))

export const loadParentProgress = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(async ({ data }) => {
    const { getAuthenticatedUser } = await import('./auth.server')
    const parent = await getAuthenticatedUser(data.tenant, 'ortu')

    return getParentProgress(data.tenant, parent)
  })

export const loadWeeklyNotes = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(({ data }) => getWeeklyNotes(data.tenant))

export const loadDailyObservationRows = createServerFn({ method: 'GET' })
  .inputValidator((data: ObservationRowsInput) => data)
  .handler(({ data }) =>
    getDailyObservationRows(data.tenant, data.classId, data.observedAt),
  )

export const loadObservationPage = createServerFn({ method: 'GET' })
  .inputValidator((data: TenantInput) => data)
  .handler(async ({ data }) => {
    const classes = await getTenantClasses(data.tenant)
    const classId = classes[0]?.id ?? ''
    const [students, rows] = await Promise.all([
      getTenantStudents(data.tenant),
      classId ? getDailyObservationRows(data.tenant, classId) : [],
    ])

    return { classes, students, rows, observedAt: todayIso() }
  })
