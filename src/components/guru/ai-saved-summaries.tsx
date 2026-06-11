import { useState } from 'react'
import { Trash2, Undo2 } from 'lucide-react'
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
import type { AiSummaryListItem } from '#/server/tenant-data'

type Props = {
  summaries: Array<AiSummaryListItem>
  onRevoke: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function AiSavedSummaries({ summaries, onRevoke, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!summaries.length) {
    return (
      <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-foreground/5">
        Belum ada ringkasan tersimpan untuk kelas dan minggu ini.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {summaries.map((summary) => (
        <div
          key={summary.id}
          className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/5"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-heading font-semibold">
                {summary.studentName}
              </p>
              <p className="text-xs text-muted-foreground">
                Disimpan {summary.createdLabel}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-brand-orange"
                onClick={() => void onRevoke(summary.id)}
              >
                <Undo2 className="size-4" />
                Cabut
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-destructive"
                onClick={() => setDeletingId(summary.id)}
              >
                <Trash2 className="size-4" />
                Hapus
              </Button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {summary.content}
          </p>
        </div>
      ))}

      <Dialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus ringkasan ini?</DialogTitle>
            <DialogDescription>
              Ringkasan akan dihapus permanen dan tidak lagi tampil untuk orang
              tua. Siswa dapat digenerate ulang untuk minggu ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>
              Batal
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingId) {
                  void onDelete(deletingId)
                  setDeletingId(null)
                }
              }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
