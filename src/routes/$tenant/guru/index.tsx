import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Users,
  MessageCircle,
  UsersRound,
  ShieldCheck,
  Plus,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { KpiCard } from '#/components/guru/kpi-card'
import { GenderDistributionCard } from '#/components/guru/gender-distribution-card'
import { genderDistribution, kpiStats } from '#/data'

export const Route = createFileRoute('/$tenant/guru/')({
  component: BerandaGuru,
  staticData: { title: 'Beranda Guru' },
})

const icons = [Users, MessageCircle, UsersRound, ShieldCheck]

function BerandaGuru() {
  const { tenant } = Route.useParams()
  const navigate = useNavigate()

  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <PageHeader title="Beranda Guru" />

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {kpiStats.map((kpi, idx) => (
              <KpiCard
                key={kpi.indicator}
                label={kpi.label}
                value={kpi.frequencyLabel}
                icon={icons[idx] ?? Users}
              />
            ))}
          </div>
          <GenderDistributionCard
            laki={genderDistribution.laki}
            perempuan={genderDistribution.perempuan}
          />
        </div>

        <Button
          size="lg"
          className="h-12 w-full justify-center gap-2 rounded-xl text-sm sm:text-base"
          onClick={() =>
            void navigate({
              to: '/$tenant/guru/catat-observasi',
              params: { tenant },
            })
          }
        >
          <Plus />
          CATAT OBSERVASI HARI INI
        </Button>
      </div>
    </ContentPanel>
  )
}
