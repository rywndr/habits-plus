import { useEffect, useMemo, useState } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { cn } from '#/lib/utils'
import { addDaysIso, toIsoDate, weekEndIso, weekStartIso } from '#/server/date'

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function startOfMonthGrid(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7))
  return first
}

type Props = {
  value: string
  onChange: (value: string) => void
}

export function weekLabel(value: string) {
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
  const selected = new Date(weekStart)
  const [view, setView] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  )
  const days = useMemo(() => {
    const start = startOfMonthGrid(view)
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }, [view])

  useEffect(() => {
    setView(new Date(selected.getFullYear(), selected.getMonth(), 1))
  }, [selected.getFullYear(), selected.getMonth()])

  return (
    <div className="flex w-full min-w-0 max-w-full items-center rounded-full bg-card ring-1 ring-border sm:w-64 sm:min-w-64 sm:max-w-64 sm:shrink-0">
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
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="min-w-0 flex-1 gap-2 rounded-full px-2 font-heading text-sm leading-snug font-medium"
              aria-label={`Pilih minggu, ${weekLabel(weekStart)}`}
            >
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{weekLabel(weekStart)}</span>
            </Button>
          }
        />
        <PopoverContent className="w-72 p-3">
          <div className="mb-3 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Bulan sebelumnya"
              onClick={() =>
                setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
              }
            >
              <ChevronLeft />
            </Button>
            <span className="font-heading text-sm font-semibold">
              {new Intl.DateTimeFormat('id-ID', {
                month: 'long',
                year: 'numeric',
              }).format(view)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Bulan berikutnya"
              onClick={() =>
                setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
              }
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {DAYS.map((day, index) => (
              <span
                key={day}
                className={cn(
                  'py-1 font-medium text-muted-foreground',
                  index >= 5 && 'text-destructive',
                )}
              >
                {day}
              </span>
            ))}
            {days.map((date) => {
              const iso = toIsoDate(date)
              const dateWeekStart = weekStartIso(date)
              const isSelectedWeek = dateWeekStart === weekStart
              const isOutside = date.getMonth() !== view.getMonth()
              const isWeekend = date.getDay() === 0 || date.getDay() === 6

              return (
                <Button
                  key={iso}
                  type="button"
                  variant={isSelectedWeek ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  aria-label={`Pilih minggu ${weekLabel(dateWeekStart)}`}
                  onClick={() => onChange(dateWeekStart)}
                  className={cn(
                    'mx-auto',
                    isOutside && 'opacity-40',
                    isWeekend && !isSelectedWeek && 'text-destructive',
                    iso === weekStart && 'bg-primary text-primary-foreground',
                  )}
                >
                  {date.getDate()}
                </Button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
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
