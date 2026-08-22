import { createFileRoute } from '@tanstack/react-router'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { AiCostHistory } from '#/components/admin/ai-cost-history'
import { DataTableSkeleton } from '#/components/skeletons/data-table-skeleton'
import { loadAiCostHistory } from '#/server/loaders'

export const Route = createFileRoute('/admin/biaya-ai')({
  loader: () => loadAiCostHistory(),
  component: BiayaAi,
  staleTime: 30_000,
  pendingComponent: PendingBiayaAi,
  staticData: { title: 'Biaya AI' },
})

function PendingBiayaAi() {
  return <DataTableSkeleton columns={6} rows={6} showToolbarButton={false} />
}

function BiayaAi() {
  const history = Route.useLoaderData()

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Riwayat Biaya Ringkasan AI" />
        <AiCostHistory history={history} />
      </div>
    </ContentPanel>
  )
}
