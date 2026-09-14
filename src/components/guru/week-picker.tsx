import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  addDaysIso,
  formatIndonesianDate,
  weekEndIso,
  weekStartIso,
} from '#/server/date'

type Props = {
  value: string
  onChange: (value: string) => void
}

function weekLabel(value: string) {
  const start = weekStartIso(new Date(value))
  const end = weekEndIso(start)
  return `Minggu ${formatIndonesianDate(start).replace(/ \d{4}$/, '')} - ${formatIndonesianDate(end)}`
}

export function WeekPicker({ value, onChange }: Props) {
  const weekStart = weekStartIso(new Date(value))

  return (
    <div className="flex min-w-0 max-w-full items-center gap-1 rounded-full bg-card p-1 ring-1 ring-border sm:gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Minggu sebelumnya"
        onClick={() => onChange(addDaysIso(weekStart, -7))}
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-0 px-1 text-center font-heading text-sm font-semibold sm:min-w-52 sm:px-2 sm:text-base">
        {weekLabel(weekStart)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Minggu berikutnya"
        onClick={() => onChange(addDaysIso(weekStart, 7))}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
