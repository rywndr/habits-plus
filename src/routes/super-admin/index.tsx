import { createFileRoute } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { StatCard } from '#/components/admin/stat-card'
import { DashboardSkeleton } from '#/components/skeletons/dashboard-skeleton'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { loadSuperAdminDashboard } from '#/server/loaders'

export const Route = createFileRoute('/super-admin/')({
  loader: () => loadSuperAdminDashboard(),
  component: SuperAdminDashboard,
  staleTime: 30_000,
  pendingComponent: SuperAdminDashboardSkeleton,
  staticData: { title: 'Dashboard' },
})

function SuperAdminDashboardSkeleton() {
  return <DashboardSkeleton cardCount={1} showSubtitle={false} />
}

function SuperAdminDashboard() {
  const dashboard = Route.useLoaderData()

  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Super Admin Dashboard"
          className="text-2xl leading-tight sm:text-4xl"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Tenants"
            value={dashboard.tenantCount}
            icon={Building2}
          />
        </div>
      </div>
    </ContentPanel>
  )
}
