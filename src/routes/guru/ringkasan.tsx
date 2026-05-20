import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Textarea } from '#/components/ui/textarea'
import { SaveButton } from '#/components/common/save-button'
import { Skeleton } from '#/components/ui/skeleton'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { MonthPicker } from '#/components/guru/month-picker'
import { SummaryRadarChart } from '#/components/guru/summary-radar-chart'
import { ProgressStripCard } from '#/components/guru/progress-strip-card'
import { frequencyLabels, indicatorLabels } from '#/lib/domain'
import { loadLatestSummary } from '#/server/loaders'
import { saveMonthlySummary } from '#/server/actions'
import type { SaveStatus } from '#/components/common/save-button'
import type { Indicator } from '#/server/tenant-data'

export const Route = createFileRoute('/guru/ringkasan')({
  validateSearch: (search = {}) => ({
    month: typeof search.month === 'string' ? search.month : undefined,
  }),
  loaderDeps: ({ search }) => ({
    month: search.month,
  }),
  loader: ({ context, deps }) =>
    loadLatestSummary({
      data: { tenant: context.user.tenantSlug, month: deps.month },
    }),
  component: LihatRingkasan,
  staticData: { title: 'Lihat Ringkasan' },
})

const ORDER: Array<Indicator> = [
  'respons',
  'interaksi',
  'partisipasi',
  'regulasi',
]

function LihatRingkasan() {
  const router = useRouter()
  const navigate = useNavigate()
  const summary = Route.useLoaderData()
  const search = Route.useSearch()
  const [month, setMonth] = useState(search.month ?? summary.month)
  const [text, setText] = useState(summary.text)
  const [isDataPending, setIsDataPending] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  useEffect(() => {
    setMonth(search.month ?? summary.month)
    setText(summary.text)
    setIsDataPending(false)
    setSaveStatus('idle')
  }, [search.month, summary.month, summary.text])

  async function handleMonthChange(nextMonth: string) {
    setMonth(nextMonth)
    setIsDataPending(true)
    try {
      await navigate({ to: '/guru/ringkasan', search: { month: nextMonth } })
    } catch (error) {
      setIsDataPending(false)
      throw error
    }
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      await saveMonthlySummary({ data: { month, text } })
      await router.invalidate()
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('error')
      throw error
    }
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Lihat Ringkasan" />

        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold">Bulan:</span>
          <MonthPicker value={month} onChange={handleMonthChange} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm">Ringkasan dalam bulan</span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            {isDataPending ? (
              <Skeleton className="h-20 w-full rounded-2xl" />
            ) : (
              <Textarea
                value={text}
                onChange={(event) => {
                  setText(event.target.value)
                  setSaveStatus('idle')
                }}
                rows={2}
                placeholder="Tulis ringkasan perkembangan siswa untuk bulan ini."
                className="rounded-2xl bg-card"
              />
            )}
            <SaveButton
              status={saveStatus}
              size="lg"
              className="rounded-full px-6"
              wrapperClassName="sm:mt-1"
              onClick={handleSave}
              disabled={isDataPending}
            />
          </div>
        </div>

        {isDataPending ? (
          <SummaryDataSkeleton />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <SummaryRadarChart data={summary.radar} />
            <div className="flex flex-col gap-3">
              {ORDER.map((ind) => (
                <ProgressStripCard
                  key={ind}
                  indicator={ind}
                  label={indicatorLabels[ind]}
                  trend={summary.trends[ind] ?? 'tidak-terlihat'}
                  valueLabel={
                    summary.averages[ind]
                      ? frequencyLabels[summary.averages[ind]]
                      : 'Tidak Terlihat'
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </ContentPanel>
  )
}

function SummaryDataSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Skeleton className="h-72 w-full rounded-2xl" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-stretch overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/5"
          >
            <Skeleton className="h-auto w-2 shrink-0 rounded-none" />
            <div className="flex flex-1 flex-col gap-2 p-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
