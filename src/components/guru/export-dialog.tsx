import { useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { ClassSelect } from './class-select'
import type { ClassRoom } from '#/server/tenant-data'

type ExportOptions = {
  startDate: string
  endDate: string
  classId: string
}

type Props = {
  title: string
  description: string
  open: boolean
  onOpenChange: (open: boolean) => void
  classes: Array<ClassRoom>
  initialClassId: string
  initialStartDate: string
  initialEndDate: string
  isExporting: boolean
  onExport: (options: ExportOptions) => void | Promise<void>
}

export function ExportDialog({
  title,
  description,
  open,
  onOpenChange,
  classes,
  initialClassId,
  initialStartDate,
  initialEndDate,
  isExporting,
  onExport,
}: Props) {
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [classId, setClassId] = useState(initialClassId)
  const isRangeInvalid = startDate > endDate

  useEffect(() => {
    if (!open) return
    setStartDate(initialStartDate)
    setEndDate(initialEndDate)
    setClassId(initialClassId)
  }, [initialClassId, initialEndDate, initialStartDate, open])

  function handleExport() {
    if (!classId || isRangeInvalid) return
    void onExport({ startDate, endDate, classId })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Kelas</label>
            <ClassSelect
              classes={classes}
              value={classId}
              onChange={setClassId}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Dari tanggal</label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Sampai tanggal</label>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          {isRangeInvalid ? (
            <p className="text-sm text-destructive">
              Tanggal awal harus sebelum atau sama dengan tanggal akhir.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Batal
          </DialogClose>
          <Button
            onClick={handleExport}
            disabled={isExporting || isRangeInvalid || !classId}
          >
            {isExporting ? 'Mengekspor...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
