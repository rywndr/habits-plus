import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { WeekPicker } from '#/components/guru/week-picker'
import { WeeklyQuestionInput } from '#/components/guru/weekly-question-input'
import { WeeklyNotesTable } from '#/components/guru/weekly-notes-table'
import { saveWeeklyNote } from '#/server/actions'
import { loadWeeklyNotes } from '#/server/loaders'
import { WeeklyNotesSkeleton } from '#/components/skeletons/weekly-notes-skeleton'

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

  useEffect(() => {
    setP1(weeklyNotes.selectedNote?.p1 ?? SAMPLE)
    setP2(weeklyNotes.selectedNote?.p2 ?? SAMPLE)
    setP3(weeklyNotes.selectedNote?.p3 ?? SAMPLE)
  }, [weeklyNotes.selectedNote])

  async function handleWeekChange(weekStart: string) {
    await navigate({
      to: '/guru/observasi-mingguan',
      search: { weekStart },
    })
  }

  async function handleSave() {
    await saveWeeklyNote({
      data: { weekStart: weeklyNotes.selectedWeekStart, p1, p2, p3 },
    })
    await router.invalidate()
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

        <div className="flex flex-col gap-4">
          <WeeklyQuestionInput
            index={1}
            question="Pendekatan apa yang digunakan minggu ini?"
            code="P1"
            value={p1}
            onChange={setP1}
          />
          <WeeklyQuestionInput
            index={2}
            question="Apa yang terasa membantu?"
            code="P2"
            value={p2}
            onChange={setP2}
          />
          <WeeklyQuestionInput
            index={3}
            question="Apa yang perlu disesuaikan?"
            code="P3"
            value={p3}
            onChange={setP3}
          />
        </div>

        <div className="flex gap-3">
          <Button size="lg" className="rounded-full px-6" onClick={handleSave}>
            Simpan
          </Button>
          <Button size="lg" variant="secondary" className="rounded-full px-6">
            Batal
          </Button>
        </div>

        <WeeklyNotesTable weeklyNotes={weeklyNotes.notes} />
      </div>
    </ContentPanel>
  )
}
