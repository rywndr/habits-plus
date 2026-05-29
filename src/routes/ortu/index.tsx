import { createFileRoute } from '@tanstack/react-router'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { SummaryTextbox } from '#/components/ortu/summary-textbox'
import { ProgressGraphicCard } from '#/components/ortu/progress-graphic-card'
import { ParentProgressSkeleton } from '#/components/skeletons/parent-progress-skeleton'
import { loadParentProgress } from '#/server/loaders'

export const Route = createFileRoute('/ortu/')({
  loader: () => loadParentProgress({ data: {} }),
  component: LihatProgres,
  pendingComponent: ParentProgressSkeleton,
  staticData: { title: 'Lihat Progres' },
})

function LihatProgres() {
  const progress = Route.useLoaderData()

  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={
            <>
              Lihat Progres,{' '}
              <span className="font-bold">{progress.childName}</span>
            </>
          }
        />

        <SummaryTextbox value={progress.summaryText} />

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
      </div>
    </ContentPanel>
  )
}
