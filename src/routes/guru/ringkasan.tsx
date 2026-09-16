import { affectsMonthlySummary } from '#/lib/route-invalidation'
import { settleLatestNavigation } from '#/lib/navigation-token'
import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Textarea } from '#/components/ui/textarea'
import { SaveButton } from '#/components/common/save-button'
import { Skeleton } from '#/components/ui/skeleton'
import { ContentPanel } from '#/components/shell/content-panel'
import { HeaderFilter, HeaderFilters } from '#/components/guru/header-filters'
import { PageHeader } from '#/components/shell/page-header'
import { MonthPicker } from '#/components/guru/month-picker'
import { ClassSelect } from '#/components/guru/class-select'
import { ClassRequiredContent } from '#/components/guru/class-required-content'
import { SummaryRadarChart } from '#/components/guru/summary-radar-chart'
import { ProgressStripCard } from '#/components/guru/progress-strip-card'
import { SummaryPageSkeleton } from '#/components/skeletons/summary-page-skeleton'
import { frequencyLabels, indicatorLabels } from '#/lib/domain'
import { loadLatestSummary } from '#/server/loaders'
import { saveMonthlySummary } from '#/server/actions'
import type { SaveStatus } from '#/components/common/save-button'
import type { Indicator } from '#/server/tenant-data'
import { PeriodAvailabilityNav } from '#/components/guru/period-availability-nav'
import { formatIndonesianMonth } from '#/server/date'

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
  component: RingkasanBulanan,
  staleTime: 30_000,
  pendingComponent: SummaryPageSkeleton,
  staticData: { title: 'Ringkasan Bulanan' },
})

const ORDER: Array<Indicator> = [
  'respons',
  'interaksi',
  'partisipasi',
  'regulasi',
]

function RingkasanBulanan() {
  const router = useRouter()
  const navigate = useNavigate()
  const summary = Route.useLoaderData()
  const search = Route.useSearch()
  const [month, setMonth] = useState(search.month ?? summary.month)
  const [classId, setClassId] = useState(summary.classId)
  const [text, setText] = useState(summary.text)
  const [isDataPending, setIsDataPending] = useState(false)
  const [navigationError, setNavigationError] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const hasObservationData = summary.radar.some(
    (point) => Object.keys(point.values).length > 0,
  )

  useEffect(() => {
    setMonth(search.month ?? summary.month)
    setClassId(summary.classId)
    setText(summary.text)
    setIsDataPending(false)
    setNavigationError(false)
    setSaveStatus('idle')
  }, [search.month, summary.month, summary.text, summary.classId])

  const pendingNavToken = useRef(0)

  async function navigateTo(next: { month: string; classId: string }) {
    setIsDataPending(true)
    setNavigationError(false)
    const token = ++pendingNavToken.current
    const startHref = router.state.location.href
    const nextSearch = {
      month: next.month,
      classId: next.classId || undefined,
    }
    try {
      await router.preloadRoute({ to: '/guru/ringkasan', search: nextSearch })
      if (token !== pendingNavToken.current) return
      if (router.state.location.href !== startHref) return
      await navigate({ to: '/guru/ringkasan', search: nextSearch })
    } catch {
      settleLatestNavigation(token, pendingNavToken.current, () => {
        setMonth(search.month ?? summary.month)
        setClassId(summary.classId)
        setIsDataPending(false)
        setNavigationError(true)
      })
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
    if (!classId) return

    setSaveStatus('saving')
    try {
      await saveMonthlySummary({ data: { month, classId, text } })
      await router.invalidate({ filter: affectsMonthlySummary })
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('error')
      throw error
    }
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Ringkasan Bulanan"
          className="text-2xl leading-tight sm:text-4xl"
        />

        <HeaderFilters>
          <HeaderFilter label="Bulan">
            <MonthPicker value={month} onChange={handleMonthChange} />
          </HeaderFilter>
          <HeaderFilter
            label="Kelas"
            className="flex-1 lg:ml-auto lg:min-w-36 lg:flex-none"
          >
            <ClassSelect
              classes={summary.classes}
              value={classId}
              onChange={handleClassChange}
            />
          </HeaderFilter>
        </HeaderFilters>

        {navigationError && (
          <p role="alert" className="text-sm text-destructive">
            Data gagal dimuat. Pilihan dikembalikan ke data sebelumnya. Coba
            lagi.
          </p>
        )}

        {classId && !isDataPending && (
          <PeriodAvailabilityNav
            availability={summary.availability}
            selectedPeriod={month}
            formatPeriod={formatIndonesianMonth}
            onOpenLatest={(latestMonth) => void handleMonthChange(latestMonth)}
          />
        )}

        <ClassRequiredContent classId={classId}>
          {isDataPending ? (
            <>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
              <SummaryDataSkeleton />
            </>
          ) : hasObservationData ? (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-sm">Ringkasan dalam bulan</span>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
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
                          : 'Belum Dipantau'
                      }
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">
              Belum ada data
            </div>
          )}
        </ClassRequiredContent>
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
