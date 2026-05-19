import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { ClassSelect } from '#/components/guru/class-select'
import { ObservationTable } from '#/components/guru/observation-table'
import { saveDailyObservations } from '#/server/actions'
import { loadObservationPage } from '#/server/loaders'
import { ObservationPageSkeleton } from '#/components/skeletons/observation-page-skeleton'
import { DatePicker } from '#/components/guru/date-picker'
import type { Frequency, Indicator, Student } from '#/server/tenant-data'

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
  loader: ({ context, deps }) =>
    loadObservationPage({
      data: {
        tenant: context.user.tenantSlug,
        classId: deps.classId,
        observedAt: deps.observedAt,
      },
    }),
  component: CatatObservasi,
  pendingComponent: ObservationPageSkeleton,
  pendingMs: 60_000,
  staticData: { title: 'Catat Observasi' },
})

function getEmptyRows(students: Array<Student>, classId: string) {
  return students
    .filter((student) => student.classId === classId)
    .map((student) => ({
      studentId: student.id,
      values: {
        respons: 'tidak-terlihat',
        interaksi: 'tidak-terlihat',
        partisipasi: 'tidak-terlihat',
        regulasi: 'tidak-terlihat',
      } satisfies Record<Indicator, Frequency>,
    }))
}

function CatatObservasi() {
  const router = useRouter()
  const navigate = useNavigate()
  const data = Route.useLoaderData()
  const [classId, setClassId] = useState(data.classId)
  const [observedAt, setObservedAt] = useState(data.observedAt)
  const [rows, setRows] = useState(data.rows)
  const [note, setNote] = useState(data.note)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  )

  useEffect(() => {
    setClassId(data.classId)
    setObservedAt(data.observedAt)
    setRows(data.rows)
    setNote(data.note)
  }, [data.classId, data.note, data.observedAt, data.rows])

  async function handleClassChange(nextClassId: string) {
    setSaveStatus('idle')
    setClassId(nextClassId)
    setRows(getEmptyRows(data.students, nextClassId))
    setNote('')
    await navigate({
      to: '/guru/catat-observasi',
      search: { classId: nextClassId, observedAt },
    })
  }

  async function handleDateChange(nextObservedAt: string) {
    setSaveStatus('idle')
    setObservedAt(nextObservedAt)
    setRows(getEmptyRows(data.students, classId))
    setNote('')
    await navigate({
      to: '/guru/catat-observasi',
      search: { classId, observedAt: nextObservedAt },
    })
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      await saveDailyObservations({
        data: { classId, observedAt, note, rows },
      })
      await router.invalidate()
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('idle')
      throw error
    }
  }

  function handleRowsChange(nextRows: typeof rows) {
    setRows(nextRows)
    setSaveStatus('idle')
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Catat Observasi" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <span className="font-heading font-semibold">Tanggal :</span>
            <DatePicker value={observedAt} onChange={handleDateChange} />
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
              onChange={(e) => {
                setNote(e.target.value)
                setSaveStatus('idle')
              }}
              placeholder="Pendekatan instruksi bertahap membantu sebagian siswa mengikuti kegiatan dengan lebih tenang hari ini."
              className="rounded-full bg-card"
            />
          </div>
          <Button
            size="lg"
            className="mt-1 gap-2 self-end rounded-full sm:mt-7"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving'
              ? 'MENYIMPAN'
              : saveStatus === 'saved'
                ? 'TERSIMPAN'
                : 'SIMPAN'}
            <Plus />
          </Button>
        </div>

        <ObservationTable
          students={data.students.filter(
            (student) => student.classId === classId,
          )}
          rows={rows}
          onRowsChange={handleRowsChange}
        />
      </div>
    </ContentPanel>
  )
}
