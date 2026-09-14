import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { addDaysIso, weekEndIso, weekStartIso } from '#/server/date'

type Props = {
  value: string
  onChange: (value: string) => void
}

function weekLabel(value: string) {
  const start = weekStartIso(new Date(value))
  const end = weekEndIso(start)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatRange(new Date(start), new Date(end))
}

export function WeekPicker({ value, onChange }: Props) {
  const weekStart = weekStartIso(new Date(value))

  return (
    <div className="flex min-w-0 max-w-full items-center rounded-full bg-card ring-1 ring-border">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-11 rounded-full"
        aria-label="Minggu sebelumnya"
        onClick={() => onChange(addDaysIso(weekStart, -7))}
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-0 flex-1 px-2 text-center font-heading text-sm leading-snug font-medium">
        {weekLabel(weekStart)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-11 rounded-full"
        aria-label="Minggu berikutnya"
        onClick={() => onChange(addDaysIso(weekStart, 7))}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
