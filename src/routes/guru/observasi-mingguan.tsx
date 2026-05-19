import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { MonthPicker } from '#/components/guru/month-picker'
import { WeeklyQuestionInput } from '#/components/guru/weekly-question-input'
import { WeeklyNotesTable } from '#/components/guru/weekly-notes-table'
import { saveWeeklyNote } from '#/server/actions'
import { weekStartIso } from '#/server/date'
import { loadWeeklyNotes } from '#/server/loaders'

export const Route = createFileRoute('/guru/observasi-mingguan')({
  loader: () => loadWeeklyNotes({ data: {} }),
  component: ObservasiMingguan,
  staticData: { title: 'Observasi Mingguan' },
})

const SAMPLE =
  'Dalam 2 minggu terakhir, respons terhadap instruksi terlihat lebih konsisten.'

function ObservasiMingguan() {
  const router = useRouter()
  const weeklyNotes = Route.useLoaderData()
  const [month, setMonth] = useState('Januari 2026')
  const [p1, setP1] = useState(SAMPLE)
  const [p2, setP2] = useState(SAMPLE)
  const [p3, setP3] = useState(SAMPLE)

  async function handleSave() {
    await saveWeeklyNote({
      data: { weekStart: weekStartIso(), p1, p2, p3 },
    })
    await router.invalidate()
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Observasi Mingguan" />

        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold">Tanggal:</span>
          <MonthPicker value={month} onChange={setMonth} showIcon />
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

        <WeeklyNotesTable weeklyNotes={weeklyNotes} />
      </div>
    </ContentPanel>
  )
}
