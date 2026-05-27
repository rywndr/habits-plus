import { createFileRoute } from '@tanstack/react-router'
import { DataTableSkeleton } from '#/components/skeletons/data-table-skeleton'
import { SchoolsPage } from '#/components/super-admin/schools-page'
import { loadSuperAdminSchools } from '#/server/loaders'

export const Route = createFileRoute('/super-admin/')({
  loader: () => loadSuperAdminSchools(),
  component: SuperAdminSchoolsRoute,
  pendingComponent: PendingSchoolsTable,
  staticData: { title: 'Tambah Sekolah' },
})

function PendingSchoolsTable() {
  return <DataTableSkeleton columns={4} rows={6} />
}

function SuperAdminSchoolsRoute() {
  const schools = Route.useLoaderData()

  return <SchoolsPage schools={schools} />
}
