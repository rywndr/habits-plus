import type { ReactNode } from 'react'
import { useState } from 'react'
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

type DeleteEntityDialogProps<T> = {
  entity: T | null
  title: string
  description: (entity: T | null) => ReactNode
  onClose: () => void
  onDelete: (entity: T) => Promise<void>
}

export function DeleteEntityDialog<T>({
  entity,
  title,
  description,
  onClose,
  onDelete,
}: DeleteEntityDialogProps<T>) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!entity) return

    setIsDeleting(true)
    try {
      await onDelete(entity)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog
      open={entity !== null}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description(entity)}</DialogDescription>
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
