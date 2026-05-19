import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { ClassSelect } from '#/components/guru/class-select'
import { ObservationTable } from '#/components/guru/observation-table'
import { saveDailyObservations } from '#/server/actions'
import { loadObservationPage } from '#/server/loaders'
import type { Frequency, Indicator } from '#/server/tenant-data'
import { formatIndonesianDate } from '#/server/date'

export const Route = createFileRoute('/guru/catat-observasi')({
  loader: () => loadObservationPage({ data: {} }),
  component: CatatObservasi,
  staticData: { title: 'Catat Observasi' },
})

function CatatObservasi() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const [classId, setClassId] = useState(data.classes[0]?.id ?? '')
  const [rows, setRows] = useState(data.rows)
  const [note, setNote] = useState('')

  function handleClassChange(nextClassId: string) {
    setClassId(nextClassId)
    setRows(
      data.students
        .filter((student) => student.classId === nextClassId)
        .map((student) => ({
          studentId: student.id,
          values: {
            respons: 'tidak-terlihat',
            interaksi: 'tidak-terlihat',
            partisipasi: 'tidak-terlihat',
            regulasi: 'tidak-terlihat',
          } satisfies Record<Indicator, Frequency>,
        })),
    )
  }

  async function handleSave() {
    await saveDailyObservations({
      data: { classId, observedAt: data.observedAt, note, rows },
    })
    await router.invalidate()
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Catat Observasi" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <span className="font-heading font-semibold">Tanggal :</span>
            <span className="rounded-full bg-card px-3 py-1 text-foreground">
              {formatIndonesianDate(data.observedAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <span className="font-heading font-semibold">Pilih kelas</span>
            <ClassSelect
              classes={data.classes}
              value={classId}
              onChange={handleClassChange}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <label className="mb-1 block text-sm">
              Catatan singkat (opsional)
            </label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Pendekatan instruksi bertahap membantu sebagian siswa mengikuti kegiatan dengan lebih tenang hari ini."
              className="rounded-full bg-card"
            />
          </div>
          <Button
            size="lg"
            className="mt-1 gap-2 self-end rounded-full sm:mt-7"
            onClick={handleSave}
          >
            SIMPAN
            <Plus />
          </Button>
        </div>

        <ObservationTable
          students={data.students.filter(
            (student) => student.classId === classId,
          )}
          rows={rows}
          onRowsChange={setRows}
        />
      </div>
    </ContentPanel>
  )
}
