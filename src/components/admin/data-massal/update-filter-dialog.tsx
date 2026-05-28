import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
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
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '#/components/ui/select'
import { ALL_CLASSES } from './templates'
import type { Template } from './templates'
import type { ClassRoom } from '#/server/tenant-data'

type Props = {
  template: Template | null
  classes: Array<ClassRoom>
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload: (template: Template, classId: string) => void
}

export function UpdateFilterDialog({
  template,
  classes,
  open,
  onOpenChange,
  onDownload,
}: Props) {
  const [classId, setClassId] = useState<string>(ALL_CLASSES)

  useEffect(() => {
    if (open) setClassId(ALL_CLASSES)
  }, [open, template?.kind])

  const selectedClass = classes.find((klass) => klass.id === classId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Unduh Template Pembaruan {template?.title ?? ''}
          </DialogTitle>
          <DialogDescription>
            Pilih kelas untuk membatasi data yang diunduh. Edit data di file
            Excel lalu unggah kembali untuk memperbarui.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Kelas</Label>
          <Select
            value={classId}
            onValueChange={(next) => next && setClassId(next)}
          >
            <SelectTrigger className="w-full">
              <span className="min-w-0 flex-1 truncate text-left">
                {classId === ALL_CLASSES
                  ? 'Semua kelas'
                  : (selectedClass?.name ?? 'Pilih kelas')}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLASSES}>Semua kelas</SelectItem>
              {classes.map((klass) => (
                <SelectItem key={klass.id} value={klass.id}>
                  {klass.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>Batal</DialogClose>
          <Button
            type="button"
            className="gap-2"
            disabled={!template}
            onClick={() => template && onDownload(template, classId)}
          >
            <Download />
            Unduh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
