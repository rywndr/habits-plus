import { createFileRoute } from '@tanstack/react-router'
import { DataTableSkeleton } from '#/components/skeletons/data-table-skeleton'
import { SchoolsPage } from '#/components/super-admin/schools-page'
import { loadSuperAdminSchools } from '#/server/loaders'

export const Route = createFileRoute('/super-admin/tenants')({
  loader: () => loadSuperAdminSchools(),
  component: SuperAdminTenantsRoute,
  staleTime: 30_000,
  pendingComponent: PendingTenantsTable,
  staticData: { title: 'Tenants' },
})

function PendingTenantsTable() {
  return <DataTableSkeleton columns={4} rows={6} />
}

function SuperAdminTenantsRoute() {
  const tenants = Route.useLoaderData()

  return <SchoolsPage schools={tenants} />
}
