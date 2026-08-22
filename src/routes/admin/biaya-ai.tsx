import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { WeekPicker } from '#/components/guru/week-picker'
import { DatePicker } from '#/components/guru/date-picker'
import { ALL_CLASSES, ClassSelect } from '#/components/guru/class-select'
import { AiCostHistory } from '#/components/admin/ai-cost-history'
import { DataTableSkeleton } from '#/components/skeletons/data-table-skeleton'
import { loadAiCostHistory } from '#/server/loaders'

export const Route = createFileRoute('/admin/biaya-ai')({
  validateSearch: (search = {}) => ({
    weekStart:
      typeof search.weekStart === 'string' ? search.weekStart : undefined,
    classId: typeof search.classId === 'string' ? search.classId : undefined,
  }),
  loaderDeps: ({ search }) => ({
    weekStart: search.weekStart,
    classId: search.classId,
  }),
  loader: ({ deps }) =>
    loadAiCostHistory({
      data: {
        weekStart: deps.weekStart,
        classId: deps.classId,
      },
    }),
  component: BiayaAi,
  staleTime: 30_000,
  pendingComponent: PendingBiayaAi,
  staticData: { title: 'Biaya AI' },
})

function PendingBiayaAi() {
  return <DataTableSkeleton columns={6} rows={6} showToolbarButton={false} />
}

function BiayaAi() {
  const navigate = useNavigate()
  const data = Route.useLoaderData()

  function navigateTo(next: { weekStart: string; classId: string }) {
    void navigate({
      to: '/admin/biaya-ai',
      search: {
        weekStart: next.weekStart,
        classId: next.classId === ALL_CLASSES ? undefined : next.classId,
      },
    })
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Riwayat Biaya Ringkasan AI" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading font-semibold">Minggu:</span>
            <WeekPicker
              value={data.selectedWeekStart}
              onChange={(weekStart) =>
                navigateTo({ weekStart, classId: data.classId })
              }
            />
            <DatePicker
              value={data.selectedWeekStart}
              onChange={(date) =>
                navigateTo({ weekStart: date, classId: data.classId })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold">Kelas:</span>
            <ClassSelect
              classes={data.classes}
              value={data.classId || ALL_CLASSES}
              onChange={(classId) =>
                navigateTo({ weekStart: data.selectedWeekStart, classId })
              }
              includeAll
            />
          </div>
        </div>

        <AiCostHistory history={data.history} />
      </div>
    </ContentPanel>
  )
}
