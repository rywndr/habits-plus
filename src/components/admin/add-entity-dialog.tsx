import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'

type Props = {
  title: string
  description?: string
  children: ReactNode
}

export function AddEntityDialog({ title, description, children }: Props) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button size="lg" className="gap-2 rounded-full">
            <Plus />
            Tambah
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="flex flex-col gap-4">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
