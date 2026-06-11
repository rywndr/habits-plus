import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { ContentPanel } from '#/components/shell/content-panel'
import { ProgressGraphicCard } from '#/components/ortu/progress-graphic-card'
import { WeeklySummaryCard } from '#/components/ortu/weekly-summary-card'
import { SummaryHistoryList } from '#/components/ortu/summary-history-list'
import { ParentProgressSkeleton } from '#/components/skeletons/parent-progress-skeleton'
import { loadParentProgress } from '#/server/loaders'

export const Route = createFileRoute('/ortu/')({
  loader: () => loadParentProgress({ data: {} }),
  component: LihatProgres,
  staleTime: 30_000,
  pendingComponent: ParentProgressSkeleton,
  staticData: { title: 'Lihat Progres' },
})

function LihatProgres() {
  const progress = Route.useLoaderData()
  const user = useLoaderData({ from: '/ortu' })

  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl bg-card p-6 ring-1 ring-foreground/5 sm:p-8">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            Halo, {user.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ananda: <span className="font-medium">{progress.childName}</span>
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold">
            Empat Kebiasaan yang Kami Amati
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {progress.indicators.map((ind) => (
              <ProgressGraphicCard
                key={ind.indicator}
                label={ind.label}
                trend={ind.trend}
                graphic={ind.graphic}
              />
            ))}
          </div>
        </section>

        <WeeklySummaryCard
          content={progress.summaryText}
          weekLabel={progress.latestWeekLabel}
        />

        <SummaryHistoryList items={progress.history} />
      </div>
    </ContentPanel>
  )
}
