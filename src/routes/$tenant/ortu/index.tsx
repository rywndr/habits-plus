import { createFileRoute } from '@tanstack/react-router'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { SummaryTextbox } from '#/components/ortu/summary-textbox'
import { ProgressGraphicCard } from '#/components/ortu/progress-graphic-card'
import {
  getCurrentUser,
  parentIndicators,
  parentSummaryText,
  students,
} from '#/data'

export const Route = createFileRoute('/$tenant/ortu/')({
  component: LihatProgres,
  staticData: { title: 'Lihat Progres' },
})

function LihatProgres() {
  const parent = getCurrentUser('ortu')
  const child = students.find((s) => s.id === parent.studentId)
  const childName = child?.name ?? 'Anak'

  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={
            <>
              Lihat Progres, <span className="font-bold">{childName}</span>
            </>
          }
        />

        <SummaryTextbox value={parentSummaryText} />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {parentIndicators.map((ind) => (
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
