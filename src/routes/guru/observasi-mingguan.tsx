import { ObservationCardsSkeleton } from '#/components/guru/observation-cards-skeleton'
import { affectsWeeklyNotes } from '#/lib/route-invalidation'
import { settleLatestNavigation } from '#/lib/navigation-token'
import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { SaveButton } from '#/components/common/save-button'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { ContentPanel } from '#/components/shell/content-panel'
import { HeaderFilter, HeaderFilters } from '#/components/guru/header-filters'
import { PageHeader } from '#/components/shell/page-header'
import { WeekReferenceFilters } from '#/components/guru/week-reference-filters'
import { ClassSelect } from '#/components/guru/class-select'
import { ClassRequiredContent } from '#/components/guru/class-required-content'
import { ExportDialog } from '#/components/guru/export-dialog'
import { downloadWeeklyNotesWorkbook } from '#/components/guru/export-workbooks'
import { WeeklyQuestionInput } from '#/components/guru/weekly-question-input'
import { WeeklyNotesTable } from '#/components/guru/weekly-notes-table'
import { WeeklyNotesSkeleton } from '#/components/skeletons/weekly-notes-skeleton'
import { deleteWeeklyNote, saveWeeklyNote } from '#/server/actions'
import { loadWeeklyNotes, loadWeeklyNotesExport } from '#/server/loaders'
import { weekEndIso } from '#/server/date'
import { PeriodAvailabilityNav } from '#/components/guru/period-availability-nav'
import { weekLabel } from '#/components/guru/week-picker'
import type { SaveStatus } from '#/components/common/save-button'
import type { WeeklyNote } from '#/server/tenant-data'

export const Route = createFileRoute('/guru/observasi-mingguan')({
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
    loadWeeklyNotes({
      data: {
        weekStart: deps.weekStart,
        classId: deps.classId,
      },
    }),
  component: ObservasiMingguan,
  staleTime: 30_000,
  pendingComponent: WeeklyNotesSkeleton,
  staticData: { title: 'Observasi Mingguan' },
})

function ObservasiMingguan() {
  const router = useRouter()
  const navigate = useNavigate()
  const weeklyNotes = Route.useLoaderData()
  const [weekStart, setWeekStart] = useState(weeklyNotes.selectedWeekStart)
  const [classId, setClassId] = useState(weeklyNotes.classId)
  const [p1, setP1] = useState(weeklyNotes.selectedNote?.p1 ?? '')
  const [p2, setP2] = useState(weeklyNotes.selectedNote?.p2 ?? '')
  const [p3, setP3] = useState(weeklyNotes.selectedNote?.p3 ?? '')
  const [isDataPending, setIsDataPending] = useState(false)
  const [navigationError, setNavigationError] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isOverwriteOpen, setIsOverwriteOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    setWeekStart(weeklyNotes.selectedWeekStart)
    setClassId(weeklyNotes.classId)
    setP1(weeklyNotes.selectedNote?.p1 ?? '')
    setP2(weeklyNotes.selectedNote?.p2 ?? '')
    setP3(weeklyNotes.selectedNote?.p3 ?? '')
    setIsDataPending(false)
    setNavigationError(false)
    setSaveStatus('idle')
  }, [
    weeklyNotes.selectedNote,
    weeklyNotes.selectedWeekStart,
    weeklyNotes.classId,
  ])

  const pendingNavToken = useRef(0)

  async function navigateTo(next: { weekStart: string; classId: string }) {
    setSaveStatus('idle')
    setIsDataPending(true)
    setNavigationError(false)
    const token = ++pendingNavToken.current
    const startHref = router.state.location.href
    const search = {
      weekStart: next.weekStart,
      classId: next.classId || undefined,
    }
    try {
      await router.preloadRoute({ to: '/guru/observasi-mingguan', search })
      if (token !== pendingNavToken.current) return
      if (router.state.location.href !== startHref) return
      await navigate({ to: '/guru/observasi-mingguan', search })
    } catch {
      settleLatestNavigation(token, pendingNavToken.current, () => {
        setWeekStart(weeklyNotes.selectedWeekStart)
        setClassId(weeklyNotes.classId)
        setIsDataPending(false)
        setNavigationError(true)
      })
    }
  }

  async function handleWeekChange(nextWeekStart: string) {
    setWeekStart(nextWeekStart)
    await navigateTo({ weekStart: nextWeekStart, classId })
  }

  async function handleClassChange(nextClassId: string) {
    setClassId(nextClassId)
    await navigateTo({
      weekStart,
      classId: nextClassId,
    })
  }

  function handleQuestionChange(
    setter: (value: string) => void,
    value: string,
  ) {
    setter(value)
    setSaveStatus('idle')
  }

  function handleSave() {
    if (weeklyNotes.selectedNote) {
      setIsOverwriteOpen(true)
      return
    }

    void saveNote()
  }

  async function saveNote() {
    if (!classId) return

    setIsOverwriteOpen(false)
    setSaveStatus('saving')
    try {
      await saveWeeklyNote({
        data: { weekStart: weeklyNotes.selectedWeekStart, classId, p1, p2, p3 },
      })
      await router.invalidate({ filter: affectsWeeklyNotes })
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('error')
      throw error
    }
  }

  async function handleEditNote(
    note: WeeklyNote,
    values: Pick<WeeklyNote, 'p1' | 'p2' | 'p3'>,
  ) {
    await saveWeeklyNote({
      data: { weekStart: note.date, classId: note.classId ?? '', ...values },
    })
    await router.invalidate({ filter: affectsWeeklyNotes })
  }

  async function handleDeleteNote(note: WeeklyNote) {
    await deleteWeeklyNote({ data: { id: note.id } })
    await router.invalidate({ filter: affectsWeeklyNotes })
  }

  async function handleExport(options: {
    startDate: string
    endDate: string
    classId: string
  }) {
    setIsExporting(true)
    try {
      const exportRows = await loadWeeklyNotesExport({
        data: {
          startDate: options.startDate,
          endDate: options.endDate,
          classId: options.classId,
        },
      })
      downloadWeeklyNotesWorkbook(exportRows, options)
      setIsExportOpen(false)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <ContentPanel className="min-w-0">
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Observasi Mingguan"
          className="text-2xl leading-tight sm:text-4xl"
        />

        <HeaderFilters>
          <WeekReferenceFilters
            value={weekStart}
            onChange={(value) => void handleWeekChange(value)}
          />
          <div className="flex min-w-0 items-end gap-3 lg:ml-auto">
            <HeaderFilter
              label="Kelas"
              className="flex-1 lg:min-w-36 lg:flex-none"
            >
              <ClassSelect
                classes={weeklyNotes.classes}
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
            availability={weeklyNotes.availability}
            selectedPeriod={weeklyNotes.selectedWeekStart}
            formatPeriod={weekLabel}
            onOpenLatest={(latestWeekStart) =>
              void handleWeekChange(latestWeekStart)
            }
          />
        )}

        <ClassRequiredContent classId={classId}>
          {isDataPending ? (
            <WeeklyQuestionSkeleton />
          ) : (
            <div className="flex flex-col gap-4">
              <WeeklyQuestionInput
                index={1}
                question="Pendekatan apa yang digunakan minggu ini?"
                code="P1"
                value={p1}
                placeholder="Tulis pendekatan yang digunakan minggu ini."
                onChange={(value) => handleQuestionChange(setP1, value)}
              />
              <WeeklyQuestionInput
                index={2}
                question="Apa yang terasa membantu?"
                code="P2"
                value={p2}
                placeholder="Tulis hal yang terasa membantu minggu ini."
                onChange={(value) => handleQuestionChange(setP2, value)}
              />
              <WeeklyQuestionInput
                index={3}
                question="Apa yang perlu disesuaikan?"
                code="P3"
                value={p3}
                placeholder="Tulis hal yang perlu disesuaikan minggu depan."
                onChange={(value) => handleQuestionChange(setP3, value)}
              />
            </div>
          )}

          <div className="flex gap-3">
            <SaveButton
              status={saveStatus}
              size="lg"
              className="rounded-full px-6"
              onClick={handleSave}
              disabled={isDataPending}
            />
          </div>

          {isDataPending ? (
            <WeeklyNotesTableSkeleton />
          ) : (
            <WeeklyNotesTable
              weeklyNotes={weeklyNotes.notes}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
            />
          )}
        </ClassRequiredContent>

        <Dialog open={isOverwriteOpen} onOpenChange={setIsOverwriteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Timpa observasi minggu ini?</DialogTitle>
              <DialogDescription>
                Data observasi untuk minggu yang dipilih sudah ada. Menyimpan
                akan mengganti catatan lama dengan isi terbaru.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="secondary" />}>
                Batal
              </DialogClose>
              <Button onClick={() => void saveNote()}>Timpa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ExportDialog
          title="Export observasi mingguan"
          description="Pilih kelas dan rentang minggu yang ingin diunduh dalam format XLSX."
          open={isExportOpen}
          onOpenChange={setIsExportOpen}
          classes={weeklyNotes.classes}
          initialClassId={classId}
          initialStartDate={weeklyNotes.selectedWeekStart}
          initialEndDate={weekEndIso(weeklyNotes.selectedWeekStart)}
          isExporting={isExporting}
          onExport={handleExport}
        />
      </div>
    </ContentPanel>
  )
}

function WeeklyQuestionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(3).keys()].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-72 max-w-full" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  )
}

function WeeklyNotesTableSkeleton() {
  return (
    <>
      <ObservationCardsSkeleton kind="weekly" />
      <div className="hidden lg:block overflow-hidden rounded-xl bg-card ring-1 ring-foreground/5">
        <div className="flex items-center gap-4 bg-brand-table-header px-4 py-3">
          {[...Array(6).keys()].map((i) => (
            <Skeleton
              key={i}
              className="h-3 flex-1 bg-brand-navy-foreground/30"
            />
          ))}
        </div>
        <div className="flex flex-col divide-y divide-border/40">
          {[...Array(6).keys()].map((rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
              {[...Array(6).keys()].map((cellIndex) => (
                <Skeleton key={cellIndex} className="h-3 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
