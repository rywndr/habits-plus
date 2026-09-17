import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { HeaderFilter, HeaderFilters } from '#/components/guru/header-filters'
import { WeekPicker } from '#/components/guru/week-picker'
import { DatePicker } from '#/components/guru/date-picker'
import { ALL_CLASSES, ClassSelect } from '#/components/guru/class-select'
import { AiUsageHistory } from '#/components/admin/ai-cost-history'
import { DataTableSkeleton } from '#/components/skeletons/data-table-skeleton'
import { loadAiUsageHistory } from '#/server/loaders'

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
    loadAiUsageHistory({
      data: {
        weekStart: deps.weekStart,
        classId: deps.classId,
      },
    }),
  component: BiayaAi,
  staleTime: 30_000,
  pendingComponent: PendingBiayaAi,
  staticData: { title: 'Penggunaan AI' },
})

function PendingBiayaAi() {
  return <DataTableSkeleton columns={8} rows={6} showToolbarButton={false} />
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
    <ContentPanel className="min-w-0">
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Riwayat Penggunaan AI"
          className="text-2xl leading-tight sm:text-4xl"
        />

        <HeaderFilters>
          <HeaderFilter label="Minggu">
            <WeekPicker
              value={data.selectedWeekStart}
              onChange={(weekStart) =>
                navigateTo({ weekStart, classId: data.classId })
              }
            />
          </HeaderFilter>
          <HeaderFilter label="Tanggal acuan">
            <DatePicker
              value={data.selectedWeekStart}
              onChange={(date) =>
                navigateTo({ weekStart: date, classId: data.classId })
              }
            />
          </HeaderFilter>
          <HeaderFilter
            label="Kelas"
            className="flex-1 lg:min-w-36 lg:flex-none"
          >
            <ClassSelect
              classes={data.classes}
              value={data.classId || ALL_CLASSES}
              onChange={(classId) =>
                navigateTo({ weekStart: data.selectedWeekStart, classId })
              }
              includeAll
            />
          </HeaderFilter>
        </HeaderFilters>

        <AiUsageHistory history={data.history} />
      </div>
    </ContentPanel>
  )
}
