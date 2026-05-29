import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { SaveButton } from '#/components/common/save-button'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { ALL_CLASSES, ClassSelect } from '#/components/guru/class-select'
import { ExportDialog } from '#/components/guru/export-dialog'
import { downloadDailyObservationWorkbook } from '#/components/guru/export-workbooks'
import { ObservationTable } from '#/components/guru/observation-table'
import { ObservationPageSkeleton } from '#/components/skeletons/observation-page-skeleton'
import { saveDailyObservations } from '#/server/actions'
import {
  loadDailyObservationExport,
  loadObservationPage,
} from '#/server/loaders'
import { DatePicker } from '#/components/guru/date-picker'
import type { SaveStatus } from '#/components/common/save-button'
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
  loader: ({ deps }) =>
    loadObservationPage({
      data: {
        classId: deps.classId,
        observedAt: deps.observedAt,
      },
    }),
  component: CatatObservasi,
  pendingMs: Infinity,
  pendingComponent: ObservationPageSkeleton,
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
  const [isDataPending, setIsDataPending] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    setClassId(data.classId)
    setObservedAt(data.observedAt)
    setRows(data.rows)
    setNote(data.note)
    setIsDataPending(false)
  }, [data.classId, data.note, data.observedAt, data.rows])

  async function handleClassChange(nextClassId: string) {
    setSaveStatus('idle')
    setIsDataPending(true)
    setClassId(nextClassId)
    setRows(getEmptyRows(data.students, nextClassId))
    setNote('')
    try {
      await navigate({
        to: '/guru/catat-observasi',
        search: { classId: nextClassId, observedAt },
      })
    } catch (error) {
      setIsDataPending(false)
      throw error
    }
  }

  async function handleDateChange(nextObservedAt: string) {
    setSaveStatus('idle')
    setIsDataPending(true)
    setObservedAt(nextObservedAt)
    setRows(getEmptyRows(data.students, classId))
    setNote('')
    try {
      await navigate({
        to: '/guru/catat-observasi',
        search: { classId, observedAt: nextObservedAt },
      })
    } catch (error) {
      setIsDataPending(false)
      throw error
    }
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
          classId:
            options.classId === ALL_CLASSES ? undefined : options.classId,
        },
      })
      downloadDailyObservationWorkbook(exportRows, options)
      setIsExportOpen(false)
    } finally {
      setIsExporting(false)
    }
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
          <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold">Kelas:</span>
              <ClassSelect
                classes={data.classes}
                value={classId}
                onChange={handleClassChange}
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <label className="mb-1 block text-sm">
              Catatan singkat (opsional)
            </label>
            {isDataPending ? (
              <Skeleton className="h-9 w-full rounded-full" />
            ) : (
              <Input
                value={note}
                onChange={(e) => {
                  setNote(e.target.value)
                  setSaveStatus('idle')
                }}
                placeholder="Pendekatan instruksi bertahap membantu sebagian siswa mengikuti kegiatan dengan lebih tenang hari ini."
                className="rounded-full bg-card"
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

        <ExportDialog
          title="Export observasi harian"
          description="Pilih kelas dan rentang tanggal yang ingin diunduh dalam format XLSX."
          open={isExportOpen}
          onOpenChange={setIsExportOpen}
          classes={data.classes}
          initialClassId={classId || ALL_CLASSES}
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
    <div className="flex flex-col gap-3">
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
  )
}
