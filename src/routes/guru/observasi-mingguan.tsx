import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
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
import { WeeklyQuestionInput } from '#/components/guru/weekly-question-input'
import { WeeklyNotesTable } from '#/components/guru/weekly-notes-table'
import { WeeklyNotesSkeleton } from '#/components/skeletons/weekly-notes-skeleton'
import { saveWeeklyNote } from '#/server/actions'
import { loadWeeklyNotes } from '#/server/loaders'
import type { SaveStatus } from '#/components/common/save-button'

export const Route = createFileRoute('/guru/observasi-mingguan')({
  validateSearch: (search = {}) => ({
    weekStart:
      typeof search.weekStart === 'string' ? search.weekStart : undefined,
  }),
  loaderDeps: ({ search }) => ({
    weekStart: search.weekStart,
  }),
  loader: ({ context, deps }) =>
    loadWeeklyNotes({
      data: { tenant: context.user.tenantSlug, weekStart: deps.weekStart },
    }),
  component: ObservasiMingguan,
  pendingComponent: WeeklyNotesSkeleton,
  staticData: { title: 'Observasi Mingguan' },
})

const SAMPLE =
  'Dalam 2 minggu terakhir, respons terhadap instruksi terlihat lebih konsisten.'

function ObservasiMingguan() {
  const router = useRouter()
  const navigate = useNavigate()
  const weeklyNotes = Route.useLoaderData()
  const [p1, setP1] = useState(weeklyNotes.selectedNote?.p1 ?? SAMPLE)
  const [p2, setP2] = useState(weeklyNotes.selectedNote?.p2 ?? SAMPLE)
  const [p3, setP3] = useState(weeklyNotes.selectedNote?.p3 ?? SAMPLE)
  const [isDataPending, setIsDataPending] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isOverwriteOpen, setIsOverwriteOpen] = useState(false)
  const previousWeekStart = useRef(weeklyNotes.selectedWeekStart)

  useEffect(() => {
    const didWeekChange = previousWeekStart.current !== weeklyNotes.selectedWeekStart
    previousWeekStart.current = weeklyNotes.selectedWeekStart

    setP1(weeklyNotes.selectedNote?.p1 ?? SAMPLE)
    setP2(weeklyNotes.selectedNote?.p2 ?? SAMPLE)
    setP3(weeklyNotes.selectedNote?.p3 ?? SAMPLE)
    setIsDataPending(false)
    if (didWeekChange) {
      setSaveStatus('idle')
    }
  }, [weeklyNotes.selectedNote, weeklyNotes.selectedWeekStart])

  async function handleWeekChange(weekStart: string) {
    setSaveStatus('idle')
    setIsDataPending(true)
    try {
      await navigate({
        to: '/guru/observasi-mingguan',
        search: { weekStart },
      })
    } catch (error) {
      setIsDataPending(false)
      throw error
    }
  }

  function handleQuestionChange(setter: (value: string) => void, value: string) {
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
        data: { weekStart: weeklyNotes.selectedWeekStart, p1, p2, p3 },
      })
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
        <PageHeader title="Observasi Mingguan" />

        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold">Minggu:</span>
          <WeekPicker
            value={weeklyNotes.selectedWeekStart}
            onChange={handleWeekChange}
          />
        </div>

        {isDataPending ? (
          <WeeklyQuestionSkeleton />
        ) : (
          <div className="flex flex-col gap-4">
            <WeeklyQuestionInput
              index={1}
              question="Pendekatan apa yang digunakan minggu ini?"
              code="P1"
              value={p1}
              onChange={(value) => handleQuestionChange(setP1, value)}
            />
            <WeeklyQuestionInput
              index={2}
              question="Apa yang terasa membantu?"
              code="P2"
              value={p2}
              onChange={(value) => handleQuestionChange(setP2, value)}
            />
            <WeeklyQuestionInput
              index={3}
              question="Apa yang perlu disesuaikan?"
              code="P3"
              value={p3}
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
          <Button size="lg" variant="secondary" className="rounded-full px-6">
            Batal
          </Button>
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
          <WeeklyNotesTable weeklyNotes={weeklyNotes.notes} />
        )}
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
          <Skeleton key={i} className="h-3 flex-1 bg-brand-navy-foreground/30" />
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
