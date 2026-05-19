import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { ClassSelect } from '#/components/guru/class-select'
import { ObservationTable } from '#/components/guru/observation-table'
import { classes } from '#/data'

export const Route = createFileRoute('/$tenant/guru/catat-observasi')({
  component: CatatObservasi,
  staticData: { title: 'Catat Observasi' },
})

function CatatObservasi() {
  const [classId, setClassId] = useState(classes[1].id)
  const [note, setNote] = useState('')

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Catat Observasi" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <span className="font-heading font-semibold">Tanggal :</span>
            <span className="rounded-full bg-card px-3 py-1 text-foreground">
              12 Januari 2026
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <span className="font-heading font-semibold">Pilih kelas</span>
            <ClassSelect classes={classes} value={classId} onChange={setClassId} />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <label className="mb-1 block text-sm">Catatan singkat (opsional)</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Pendekatan instruksi bertahap membantu sebagian siswa mengikuti kegiatan dengan lebih tenang hari ini."
              className="rounded-full bg-card"
            />
          </div>
          <Button size="lg" className="mt-1 gap-2 self-end rounded-full sm:mt-7">
            TAMBAH
            <Plus />
          </Button>
        </div>

        <ObservationTable />
      </div>
    </ContentPanel>
  )
}
