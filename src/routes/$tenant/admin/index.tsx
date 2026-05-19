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
import { loadAdminDashboard } from '#/server/loaders'

export const Route = createFileRoute('/$tenant/admin/')({
  loader: ({ params }) =>
    loadAdminDashboard({ data: { tenant: params.tenant } }),
  component: BerandaAdmin,
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

        <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Activity className="size-4 text-brand-orange" />
            Aktivitas Terbaru
          </div>
          <div className="grid place-items-center rounded-lg border border-dashed border-border bg-brand-panel/50 py-12 text-xs text-muted-foreground">
            [Placeholder — riwayat tambah/edit guru, siswa, observasi]
          </div>
        </div>
      </div>
    </ContentPanel>
  )
}
