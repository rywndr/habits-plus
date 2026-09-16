import { ObservationCardsSkeleton } from '#/components/guru/observation-cards-skeleton'
import { affectsObservations } from '#/lib/route-invalidation'
import { settleLatestNavigation } from '#/lib/navigation-token'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { SaveButton } from '#/components/common/save-button'
import { Textarea } from '#/components/ui/textarea'
import { Skeleton } from '#/components/ui/skeleton'
import { ContentPanel } from '#/components/shell/content-panel'
import { HeaderFilter, HeaderFilters } from '#/components/guru/header-filters'
import { PageHeader } from '#/components/shell/page-header'
import { ClassSelect } from '#/components/guru/class-select'
import { ExportDialog } from '#/components/guru/export-dialog'
import { downloadDailyObservationWorkbook } from '#/components/guru/export-workbooks'
import { ObservationTable } from '#/components/guru/observation-table'
import { ObservationPageSkeleton } from '#/components/skeletons/observation-page-skeleton'
import { saveDailyObservations } from '#/server/actions'
import {
  loadDailyObservationExport,
  loadDailyAvailabilityMonth,
  loadObservationPage,
} from '#/server/loaders'
import { DatePicker } from '#/components/guru/date-picker'
import { ClassRequiredContent } from '#/components/guru/class-required-content'
import { PeriodAvailabilityNav } from '#/components/guru/period-availability-nav'
import { formatIndonesianDate } from '#/server/date'
import type { SaveStatus } from '#/components/common/save-button'
import type { Indicator, Student } from '#/server/tenant-data'

export const Route = createFileRoute('/guru/catat-observasi')({
  validateSearch: (search = {}) => ({
    classId: typeof search.classId === 'string' ? search.classId : undefined,
    observedAt:
      typeof search.observedAt === 'string' ? search.observedAt : undefined,
  }),
  loaderDeps: ({ search }) => ({
    classId: search.classId,
    observedAt: search.observedAt,
  }),
  loader: ({ deps }) =>
    loadObservationPage({
      data: {
        classId: deps.classId,
        observedAt: deps.observedAt,
      },
    }),
  component: ObservasiHarian,
  staleTime: 30_000,
  pendingComponent: ObservationPageSkeleton,
  staticData: { title: 'Observasi Harian' },
})

function getEmptyRows(students: Array<Student>, classId: string) {
  return students
    .filter((student) => student.classId === classId)
    .map((student) => ({
      studentId: student.id,
      values: {
        respons: null,
        interaksi: null,
        partisipasi: null,
        regulasi: null,
      } satisfies Record<Indicator, null>,
    }))
}

function ObservasiHarian() {
  const router = useRouter()
  const navigate = useNavigate()
  const data = Route.useLoaderData()
  const [classId, setClassId] = useState(data.classId)
  const [observedAt, setObservedAt] = useState(data.observedAt)
  const [rows, setRows] = useState(data.rows)
  const [note, setNote] = useState(data.note)
  const [isDataPending, setIsDataPending] = useState(false)
  const [navigationError, setNavigationError] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(observedAt.slice(0, 7))
  const [availabilityByContext, setAvailabilityByContext] = useState<
    Partial<Record<string, ReadonlyArray<string>>>
  >(() => ({
    [`${data.classId}:${data.observedAt.slice(0, 7)}`]:
      data.availability.populatedDates,
  }))
  const availabilityRequestToken = useRef(0)

  useEffect(() => {
    setClassId(data.classId)
    setObservedAt(data.observedAt)
    setRows(data.rows)
    setNote(data.note)
    setIsDataPending(false)
    setNavigationError(false)
    setAvailabilityByContext((current) => ({
      ...current,
      [`${data.classId}:${data.observedAt.slice(0, 7)}`]:
        data.availability.populatedDates,
    }))
  }, [data.classId, data.note, data.observedAt, data.rows])

  const pendingNavToken = useRef(0)

  async function navigateToSearch(search: {
    classId: string | undefined
    observedAt: string | undefined
  }) {
    const token = ++pendingNavToken.current
    const startHref = router.state.location.href
    try {
      await router.preloadRoute({ to: '/guru/catat-observasi', search })
      if (token !== pendingNavToken.current) return
      if (router.state.location.href !== startHref) return
      await navigate({ to: '/guru/catat-observasi', search })
    } catch {
      settleLatestNavigation(token, pendingNavToken.current, () => {
        setClassId(data.classId)
        setObservedAt(data.observedAt)
        setVisibleMonth(data.observedAt.slice(0, 7))
        setRows(data.rows)
        setNote(data.note)
        setIsDataPending(false)
        setNavigationError(true)
      })
    }
  }

  const handleVisibleMonthChange = useCallback(
    (month: string) => {
      setVisibleMonth(month)
      if (!classId || isDataPending) return

      const key = `${classId}:${month}`
      if (availabilityByContext[key]) return

      const token = ++availabilityRequestToken.current
      void loadDailyAvailabilityMonth({ data: { classId, month } }).then(
        (dates) => {
          if (token !== availabilityRequestToken.current) return
          setAvailabilityByContext((current) => ({
            ...current,
            [key]: dates,
          }))
        },
        () => undefined,
      )
    },
    [availabilityByContext, classId, isDataPending],
  )

  async function handleClassChange(nextClassId: string) {
    setSaveStatus('idle')
    setIsDataPending(true)
    setNavigationError(false)
    setClassId(nextClassId)
    availabilityRequestToken.current += 1
    setRows(getEmptyRows(data.students, nextClassId))
    setNote('')
    await navigateToSearch({ classId: nextClassId, observedAt })
  }

  async function handleDateChange(nextObservedAt: string) {
    setSaveStatus('idle')
    setIsDataPending(true)
    setNavigationError(false)
    setObservedAt(nextObservedAt)
    setVisibleMonth(nextObservedAt.slice(0, 7))
    setRows(getEmptyRows(data.students, classId))
    setNote('')
    await navigateToSearch({ classId, observedAt: nextObservedAt })
  }

  async function handleSave() {
    if (!classId) return

    setSaveStatus('saving')
    try {
      await saveDailyObservations({
        data: { classId, observedAt, note, rows },
      })
      await router.invalidate({ filter: affectsObservations })
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('error')
      throw error
    }
  }

  function handleRowsChange(nextRows: typeof rows) {
    setRows(nextRows)
    setSaveStatus('idle')
  }

  async function handleExport(options: {
    startDate: string
    endDate: string
    classId: string
  }) {
    setIsExporting(true)
    try {
      const exportRows = await loadDailyObservationExport({
        data: {
          startDate: options.startDate,
          endDate: options.endDate,
          classId: options.classId,
        },
      })
      downloadDailyObservationWorkbook(exportRows, options)
      setIsExportOpen(false)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <ContentPanel className="min-w-0">
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Observasi Harian"
          className="text-2xl leading-tight sm:text-4xl"
        />

        <HeaderFilters>
          <HeaderFilter label="Tanggal">
            <DatePicker
              value={observedAt}
              onChange={handleDateChange}
              populatedDates={
                isDataPending
                  ? []
                  : (availabilityByContext[`${classId}:${visibleMonth}`] ?? [])
              }
              onVisibleMonthChange={handleVisibleMonthChange}
            />
          </HeaderFilter>
          <div className="flex min-w-0 items-end gap-3 lg:ml-auto">
            <HeaderFilter
              label="Kelas"
              className="flex-1 lg:min-w-36 lg:flex-none"
            >
              <ClassSelect
                classes={data.classes}
                value={classId}
                onChange={handleClassChange}
              />
            </HeaderFilter>
            <Button
              variant="outline"
              size="lg"
              className="min-h-11 shrink-0 rounded-full bg-card px-5"
              onClick={() => setIsExportOpen(true)}
            >
              <Download />
              Export
            </Button>
          </div>
        </HeaderFilters>

        {navigationError && (
          <p role="alert" className="text-sm text-destructive">
            Data gagal dimuat. Pilihan dikembalikan ke data sebelumnya. Coba
            lagi.
          </p>
        )}

        {classId && !isDataPending && (
          <PeriodAvailabilityNav
            availability={data.availability}
            selectedPeriod={observedAt}
            formatPeriod={formatIndonesianDate}
            onOpenLatest={(date) => void handleDateChange(date)}
          />
        )}

        <ClassRequiredContent classId={classId}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <label
                htmlFor="daily-observation-note"
                className="font-heading text-sm font-medium"
              >
                Catatan singkat (opsional)
              </label>
              {isDataPending ? (
                <Skeleton className="h-20 w-full rounded-2xl" />
              ) : (
                <Textarea
                  id="daily-observation-note"
                  rows={2}
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value)
                    setSaveStatus('idle')
                  }}
                  placeholder="Pendekatan instruksi bertahap membantu sebagian siswa mengikuti kegiatan dengan lebih tenang hari ini."
                  className="rounded-2xl bg-card text-base sm:text-sm"
                />
              )}
            </div>
            <SaveButton
              status={saveStatus}
              size="lg"
              className="rounded-full px-6"
              statusClassName="self-end"
              wrapperClassName="mt-1 self-end sm:mt-7"
              onClick={handleSave}
              disabled={isDataPending}
            />
          </div>

          {isDataPending ? (
            <ObservationTableSkeleton />
          ) : (
            <ObservationTable
              students={data.students.filter(
                (student) => student.classId === classId,
              )}
              rows={rows}
              onRowsChange={handleRowsChange}
            />
          )}
        </ClassRequiredContent>

        <ExportDialog
          title="Export observasi harian"
          description="Pilih kelas dan rentang tanggal yang ingin diunduh dalam format XLSX."
          open={isExportOpen}
          onOpenChange={setIsExportOpen}
          classes={data.classes}
          initialClassId={classId}
          initialStartDate={observedAt}
          initialEndDate={observedAt}
          isExporting={isExporting}
          onExport={handleExport}
        />
      </div>
    </ContentPanel>
  )
}

function ObservationTableSkeleton() {
  return (
    <>
      <ObservationCardsSkeleton kind="daily" />
      <div className="hidden flex-col gap-3 lg:flex">
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/5">
          <div className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-20" />
            {[...Array(4).keys()].map((i) => (
              <Skeleton key={i} className="h-3 w-20 bg-brand-navy/15" />
            ))}
          </div>
          <div className="flex flex-col divide-y divide-border/40">
            {[...Array(8).keys()].map((rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-20" />
                {[...Array(4).keys()].map((cellIndex) => (
                  <Skeleton key={cellIndex} className="h-6 w-20 rounded-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
