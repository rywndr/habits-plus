import { useEffect, useState } from 'react'
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
import { PageHeader } from '#/components/shell/page-header'
import { WeekPicker } from '#/components/guru/week-picker'
import { ALL_CLASSES, ClassSelect } from '#/components/guru/class-select'
import { ExportDialog } from '#/components/guru/export-dialog'
import { downloadWeeklyNotesWorkbook } from '#/components/guru/export-workbooks'
import { WeeklyQuestionInput } from '#/components/guru/weekly-question-input'
import { WeeklyNotesTable } from '#/components/guru/weekly-notes-table'
import { WeeklyNotesSkeleton } from '#/components/skeletons/weekly-notes-skeleton'
import { deleteWeeklyNote, saveWeeklyNote } from '#/server/actions'
import { loadWeeklyNotes, loadWeeklyNotesExport } from '#/server/loaders'
import { weekEndIso } from '#/server/date'
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
  pendingMs: Infinity,
  pendingComponent: WeeklyNotesSkeleton,
  staticData: { title: 'Observasi Mingguan' },
})

function ObservasiMingguan() {
  const router = useRouter()
  const navigate = useNavigate()
  const weeklyNotes = Route.useLoaderData()
  const [classId, setClassId] = useState(weeklyNotes.classId)
  const [p1, setP1] = useState(weeklyNotes.selectedNote?.p1 ?? '')
  const [p2, setP2] = useState(weeklyNotes.selectedNote?.p2 ?? '')
  const [p3, setP3] = useState(weeklyNotes.selectedNote?.p3 ?? '')
  const [isDataPending, setIsDataPending] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isOverwriteOpen, setIsOverwriteOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const isAllClasses = classId === ALL_CLASSES

  useEffect(() => {
    setClassId(weeklyNotes.classId)
    setP1(weeklyNotes.selectedNote?.p1 ?? '')
    setP2(weeklyNotes.selectedNote?.p2 ?? '')
    setP3(weeklyNotes.selectedNote?.p3 ?? '')
    setIsDataPending(false)
    setSaveStatus('idle')
  }, [
    weeklyNotes.selectedNote,
    weeklyNotes.selectedWeekStart,
    weeklyNotes.classId,
  ])

  async function navigateTo(next: { weekStart: string; classId: string }) {
    setSaveStatus('idle')
    setIsDataPending(true)
    try {
      await navigate({
        to: '/guru/observasi-mingguan',
        search: {
          weekStart: next.weekStart,
          classId: next.classId === ALL_CLASSES ? undefined : next.classId,
        },
      })
    } catch (error) {
      setIsDataPending(false)
      throw error
    }
  }

  async function handleWeekChange(weekStart: string) {
    await navigateTo({ weekStart, classId })
  }

  async function handleClassChange(nextClassId: string) {
    setClassId(nextClassId)
    await navigateTo({
      weekStart: weeklyNotes.selectedWeekStart,
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
    setIsOverwriteOpen(false)
    setSaveStatus('saving')
    try {
      await saveWeeklyNote({
        data: { weekStart: weeklyNotes.selectedWeekStart, classId, p1, p2, p3 },
      })
      await router.invalidate()
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
    await router.invalidate()
  }

  async function handleDeleteNote(note: WeeklyNote) {
    await deleteWeeklyNote({ data: { id: note.id } })
    await router.invalidate()
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
          classId:
            options.classId === ALL_CLASSES ? undefined : options.classId,
        },
      })
      downloadWeeklyNotesWorkbook(exportRows, options)
      setIsExportOpen(false)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Observasi Mingguan" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold">Minggu:</span>
            <WeekPicker
              value={weeklyNotes.selectedWeekStart}
              onChange={handleWeekChange}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold">Kelas:</span>
              <ClassSelect
                classes={weeklyNotes.classes}
                value={classId}
                onChange={handleClassChange}
                includeAll
              />
            </div>
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full px-6"
              onClick={() => setIsExportOpen(true)}
            >
              <Download />
              Export
            </Button>
          </div>
        </div>

        {isAllClasses ? (
          <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-foreground/5">
            Pilih satu kelas untuk menulis observasi mingguan. Tabel di bawah
            menampilkan catatan dari semua kelas.
          </p>
        ) : isDataPending ? (
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
            disabled={isDataPending || isAllClasses}
          />
        </div>

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

        {isDataPending ? (
          <WeeklyNotesTableSkeleton />
        ) : (
          <WeeklyNotesTable
            weeklyNotes={weeklyNotes.notes}
            showClassColumn={isAllClasses}
            onEdit={handleEditNote}
            onDelete={handleDeleteNote}
          />
        )}

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
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/5">
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
  )
}
