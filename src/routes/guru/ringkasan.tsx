import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Textarea } from '#/components/ui/textarea'
import { SaveButton } from '#/components/common/save-button'
import { Skeleton } from '#/components/ui/skeleton'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { MonthPicker } from '#/components/guru/month-picker'
import { ALL_CLASSES, ClassSelect } from '#/components/guru/class-select'
import { SummaryRadarChart } from '#/components/guru/summary-radar-chart'
import { ProgressStripCard } from '#/components/guru/progress-strip-card'
import { SummaryPageSkeleton } from '#/components/skeletons/summary-page-skeleton'
import { frequencyLabels, indicatorLabels } from '#/lib/domain'
import { loadLatestSummary } from '#/server/loaders'
import { saveMonthlySummary } from '#/server/actions'
import type { SaveStatus } from '#/components/common/save-button'
import type { Indicator } from '#/server/tenant-data'

export const Route = createFileRoute('/guru/ringkasan')({
  validateSearch: (search = {}) => ({
    month: typeof search.month === 'string' ? search.month : undefined,
    classId: typeof search.classId === 'string' ? search.classId : undefined,
  }),
  loaderDeps: ({ search }) => ({
    month: search.month,
    classId: search.classId,
  }),
  loader: ({ deps }) =>
    loadLatestSummary({
      data: {
        month: deps.month,
        classId: deps.classId,
      },
    }),
  component: LihatRingkasan,
  staleTime: 30_000,
  pendingComponent: SummaryPageSkeleton,
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
  const [classId, setClassId] = useState(summary.classId)
  const [text, setText] = useState(summary.text)
  const [isDataPending, setIsDataPending] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const isAllClasses = classId === ALL_CLASSES

  useEffect(() => {
    setMonth(search.month ?? summary.month)
    setClassId(summary.classId)
    setText(summary.text)
    setIsDataPending(false)
    setSaveStatus('idle')
  }, [search.month, summary.month, summary.text, summary.classId])

  const pendingNavToken = useRef(0)

  async function navigateTo(next: { month: string; classId: string }) {
    setIsDataPending(true)
    const token = ++pendingNavToken.current
    const startHref = router.state.location.href
    const nextSearch = {
      month: next.month,
      classId: next.classId === ALL_CLASSES ? undefined : next.classId,
    }
    try {
      await router.preloadRoute({ to: '/guru/ringkasan', search: nextSearch })
      if (token !== pendingNavToken.current) return
      if (router.state.location.href !== startHref) return
      await navigate({ to: '/guru/ringkasan', search: nextSearch })
    } catch (error) {
      setIsDataPending(false)
      throw error
    }
  }

  async function handleMonthChange(nextMonth: string) {
    setMonth(nextMonth)
    await navigateTo({ month: nextMonth, classId })
  }

  async function handleClassChange(nextClassId: string) {
    setClassId(nextClassId)
    await navigateTo({ month, classId: nextClassId })
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      await saveMonthlySummary({ data: { month, classId, text } })
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold">Bulan:</span>
            <MonthPicker value={month} onChange={handleMonthChange} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold">Kelas:</span>
            <ClassSelect
              classes={summary.classes}
              value={classId}
              onChange={handleClassChange}
              includeAll
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm">Ringkasan dalam bulan</span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            {isDataPending ? (
              <Skeleton className="h-20 w-full rounded-2xl" />
            ) : (
              <Textarea
                value={isAllClasses ? '' : text}
                onChange={(event) => {
                  setText(event.target.value)
                  setSaveStatus('idle')
                }}
                rows={2}
                disabled={isAllClasses}
                placeholder={
                  isAllClasses
                    ? 'Pilih satu kelas untuk menulis ringkasan bulanan.'
                    : 'Tulis ringkasan perkembangan siswa untuk bulan ini.'
                }
                className="rounded-2xl bg-card"
              />
            )}
            <SaveButton
              status={saveStatus}
              size="lg"
              className="rounded-full px-6"
              wrapperClassName="sm:mt-1"
              onClick={handleSave}
              disabled={isDataPending || isAllClasses}
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
