import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Users,
  MessageCircle,
  UsersRound,
  ShieldCheck,
  Plus,
  LoaderCircle,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { KpiCard } from '#/components/guru/kpi-card'
import { GenderDistributionCard } from '#/components/guru/gender-distribution-card'
import { GuruDashboardSkeleton } from '#/components/skeletons/guru-dashboard-skeleton'
import { loadGuruDashboard } from '#/server/loaders'

export const Route = createFileRoute('/guru/')({
  loader: () => loadGuruDashboard(),
  component: BerandaGuru,
  staleTime: 30_000,
  pendingComponent: GuruDashboardSkeleton,
  staticData: { title: 'Beranda Guru' },
})

const icons = [Users, MessageCircle, UsersRound, ShieldCheck]

function BerandaGuru() {
  const dashboard = Route.useLoaderData()
  const navigate = useNavigate()
  const [isNavigating, setIsNavigating] = useState(false)

  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <PageHeader title="Beranda Guru" />

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr] items-start">
          <div className="grid gap-4 sm:grid-cols-2">
            {dashboard.kpiStats.map((kpi, idx) => (
              <KpiCard
                key={kpi.indicator}
                label={kpi.label}
                value={kpi.frequencyLabel}
                icon={icons[idx] ?? Users}
              />
            ))}
          </div>
          <GenderDistributionCard
            laki={dashboard.genderDistribution.laki}
            perempuan={dashboard.genderDistribution.perempuan}
          />
        </div>

        <Button
          size="lg"
          className="h-12 w-full justify-center gap-2 rounded-xl text-sm sm:text-base"
          disabled={isNavigating}
          aria-busy={isNavigating}
          onClick={() => {
            setIsNavigating(true)
            void navigate({
              to: '/guru/catat-observasi',
            }).catch(() => setIsNavigating(false))
          }}
        >
          {isNavigating ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <Plus />
          )}
          CATAT OBSERVASI HARI INI
        </Button>
      </div>
    </ContentPanel>
  )
}
