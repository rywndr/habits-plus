import type { FileRouteTypes } from '#/routeTree.gen'

type RouteId = FileRouteTypes['id']

// Include cached dependent pages, but leave the authenticated shells alone.
const adminDataRoutes: Array<RouteId> = [
  '/admin/',
  '/admin/guru',
  '/admin/ortu',
  '/admin/kelas',
  '/admin/siswa',
  '/admin/data-massal',
  '/admin/biaya-ai',
]
const superAdminDataRoutes: Array<RouteId> = [
  '/super-admin/',
  '/super-admin/tenants',
  '/super-admin/tenant-admins',
]
const observationRoutes: Array<RouteId> = [
  '/guru/',
  '/guru/catat-observasi',
  '/guru/ringkasan',
  '/guru/laporan-orang-tua',
  '/ortu/',
]
const weeklyNoteRoutes: Array<RouteId> = [
  '/guru/observasi-mingguan',
  '/guru/laporan-orang-tua',
]
const reportRoutes: Array<RouteId> = [
  '/guru/laporan-orang-tua',
  '/ortu/',
  '/admin/biaya-ai',
]

export const affectsAdminData = (match: { routeId: RouteId }) =>
  adminDataRoutes.includes(match.routeId)
export const affectsSuperAdminData = (match: { routeId: RouteId }) =>
  superAdminDataRoutes.includes(match.routeId)
export const affectsObservations = (match: { routeId: RouteId }) =>
  observationRoutes.includes(match.routeId)
export const affectsWeeklyNotes = (match: { routeId: RouteId }) =>
  weeklyNoteRoutes.includes(match.routeId)
export const affectsReports = (match: { routeId: RouteId }) =>
  reportRoutes.includes(match.routeId)
export const affectsMonthlySummary = (match: { routeId: RouteId }) =>
  match.routeId === '/guru/ringkasan'
