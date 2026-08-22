import { useEffect, useState } from 'react'
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
import { StatusBadge } from '#/components/common/status-badge'
import { TablePagination } from '#/components/common/table-pagination'
import { indicatorLabels } from '#/lib/domain'
import type { Trend } from '#/data'
import type {
  AiSummaryListItem,
  Frequency,
  Indicator,
  StudentWeekDayData,
} from '#/server/tenant-data'

type Props = {
  summaries: Array<AiSummaryListItem>
  weekData: Record<string, Array<StudentWeekDayData>>
  onRevoke: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const PAGE_SIZE = 5

const INDICATORS: Array<Indicator> = [
  'respons',
  'interaksi',
  'partisipasi',
  'regulasi',
]

const frequencyScore: Record<Frequency, number> = {
  'tidak-terlihat': 0,
  'terlihat-sesekali': 1,
  sering: 2,
}

const trendByScore: Array<Trend> = ['tidak-terlihat', 'stabil', 'meningkat']

/** Average each indicator over the student's observed days that week. */
function weekTrends(
  days: Array<StudentWeekDayData>,
): Record<Indicator, Trend> {
  return Object.fromEntries(
    INDICATORS.map((indicator) => {
      const values = days
        .map((day) => day.scores[indicator])
        .filter((frequency): frequency is Frequency => frequency !== undefined)
      const average = values.length
        ? values.reduce((sum, frequency) => sum + frequencyScore[frequency], 0) /
          values.length
        : 0
      const score = Math.max(0, Math.min(2, Math.round(average)))
      return [indicator, trendByScore[score]]
    }),
  ) as Record<Indicator, Trend>
}

export function AiSavedSummaries({
  summaries,
  weekData,
  onRevoke,
  onDelete,
}: Props) {
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(summaries.length / PAGE_SIZE))
  const visibleSummaries = summaries.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  if (!summaries.length) {
    return (
      <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-foreground/5">
        Belum ada ringkasan tersimpan untuk kelas dan minggu ini.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleSummaries.map((summary) => {
        const trends = weekTrends(weekData[summary.studentId] ?? [])
        return (
          <div
            key={summary.id}
            className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5"
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

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {INDICATORS.map((indicator) => (
                <div
                  key={indicator}
                  className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2"
                >
                  <span className="text-xs">{indicatorLabels[indicator]}</span>
                  <StatusBadge trend={trends[indicator]} />
                </div>
              ))}
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {summary.content}
            </p>
          </div>
        )
      })}

      <TablePagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

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
