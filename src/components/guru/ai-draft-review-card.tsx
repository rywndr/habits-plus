import { Check, RotateCcw, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { frequencyLabels } from '#/lib/domain'
import type { Indicator, StudentWeekDayData } from '#/server/tenant-data'

type Props = {
  name: string
  content: string
  days: Array<StudentWeekDayData>
  busy: boolean
  onAccept: () => void
  onDeny: () => void
  onRerun: () => void
}

const INDICATOR_CODES: Array<[Indicator, string]> = [
  ['respons', 'R'],
  ['interaksi', 'I'],
  ['partisipasi', 'P'],
  ['regulasi', 'G'],
]

const dayLabelFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

export function AiDraftReviewCard({
  name,
  content,
  days,
  busy,
  onAccept,
  onDeny,
  onRerun,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-heading font-semibold">{name}</p>
        <div className="flex gap-1">
          <Button
            size="sm"
            className="gap-1 rounded-full"
            disabled={busy}
            onClick={onAccept}
          >
            <Check className="size-4" />
            Terima
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1 rounded-full"
            disabled={busy}
            onClick={onRerun}
          >
            <RotateCcw className="size-4" />
            Ulangi
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 rounded-full text-destructive"
            disabled={busy}
            onClick={onDeny}
          >
            <X className="size-4" />
            Tolak
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl bg-muted/40 p-3">
        <p className="text-xs font-semibold text-muted-foreground">
          Riwayat observasi minggu ini
        </p>
        {days.map((day) => (
          <div
            key={day.date}
            className="flex flex-wrap items-center gap-1.5 text-xs"
          >
            <span className="w-24 shrink-0 font-medium">
              {dayLabelFormatter.format(new Date(day.date))}
            </span>
            {INDICATOR_CODES.map(([indicator, code]) => {
              const frequency = day.scores[indicator]
              return (
                <span
                  key={indicator}
                  title={indicator}
                  className="rounded-full bg-card px-2 py-0.5 ring-1 ring-foreground/10"
                >
                  {code}: {frequency ? frequencyLabels[frequency] : '-'}
                </span>
              )
            })}
            {day.note ? (
              <span className="text-muted-foreground">“{day.note}”</span>
            ) : null}
          </div>
        ))}
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
    </div>
  )
}
