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
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import type { WeeklyNote } from '#/server/tenant-data'

type EditValues = {
  p1: string
  p2: string
  p3: string
}

type EditDialogProps = {
  note: WeeklyNote | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (note: WeeklyNote, values: EditValues) => Promise<void>
}

type DeleteDialogProps = {
  note: WeeklyNote | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (note: WeeklyNote) => Promise<void>
}

export function WeeklyNoteEditDialog({
  note,
  open,
  onOpenChange,
  onSave,
}: EditDialogProps) {
  const [values, setValues] = useState<EditValues>({
    p1: '',
    p2: '',
    p3: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!note) return
    setValues({ p1: note.p1, p2: note.p2, p3: note.p3 })
  }, [note])

  async function handleSave() {
    if (!note) return
    setIsSaving(true)
    try {
      await onSave(note, values)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit observasi mingguan</DialogTitle>
          <DialogDescription>
            Ubah catatan untuk minggu {note?.dateLabel ?? 'terpilih'}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {(['p1', 'p2', 'p3'] as const).map((field, index) => (
            <div key={field} className="grid gap-2">
              <Label htmlFor={`weekly-note-${field}`}>
                P{index + 1}
              </Label>
              <Textarea
                id={`weekly-note-${field}`}
                rows={3}
                value={values[field]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Batal
          </DialogClose>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function WeeklyNoteDeleteDialog({
  note,
  open,
  onOpenChange,
  onDelete,
}: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!note) return
    setIsDeleting(true)
    try {
      await onDelete(note)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus observasi mingguan?</DialogTitle>
          <DialogDescription>
            Observasi minggu {note?.dateLabel ?? 'terpilih'} akan dihapus
            permanen.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Batal
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
