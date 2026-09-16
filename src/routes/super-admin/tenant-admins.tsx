import { createFileRoute } from '@tanstack/react-router'
import { DataTableSkeleton } from '#/components/skeletons/data-table-skeleton'
import { SchoolAdminsPage } from '#/components/super-admin/school-admins-page'
import { loadSuperAdminSchoolAdmins } from '#/server/loaders'

export const Route = createFileRoute('/super-admin/tenant-admins')({
  loader: () => loadSuperAdminSchoolAdmins(),
  component: SchoolAdminsRoute,
  staleTime: 30_000,
  pendingComponent: PendingAdminTable,
  staticData: { title: 'Tenant Admins' },
})

function PendingAdminTable() {
  return <DataTableSkeleton columns={4} rows={6} />
}

function SchoolAdminsRoute() {
  const data = Route.useLoaderData()

  return <SchoolAdminsPage schools={data.schools} admins={data.admins} />
}
