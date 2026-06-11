import { createFileRoute } from '@tanstack/react-router'
import {
  GraduationCap,
  Users,
  BookOpen,
  UserCircle2,
  Activity,
} from 'lucide-react'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { StatCard } from '#/components/admin/stat-card'
import { AdminDashboardSkeleton } from '#/components/skeletons/admin-dashboard-skeleton'
import { loadAdminDashboard } from '#/server/loaders'

export const Route = createFileRoute('/admin/')({
  loader: () => loadAdminDashboard(),
  component: BerandaAdmin,
  staleTime: 30_000,
  pendingComponent: AdminDashboardSkeleton,
  staticData: { title: 'Beranda Admin' },
})

function BerandaAdmin() {
  const dashboard = Route.useLoaderData()

  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <PageHeader title="Beranda Admin" />
          <p className="text-sm text-muted-foreground">
            {dashboard.tenant.name}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Guru"
            value={dashboard.teachersCount}
            icon={GraduationCap}
          />
          <StatCard
            label="Total Siswa"
            value={dashboard.studentsCount}
            icon={Users}
          />
          <StatCard
            label="Total Kelas"
            value={dashboard.classesCount}
            icon={BookOpen}
          />
          <StatCard
            label="Total Orang Tua"
            value={dashboard.parentsCount}
            icon={UserCircle2}
          />
        </div>
      </div>
    </ContentPanel>
  )
}
