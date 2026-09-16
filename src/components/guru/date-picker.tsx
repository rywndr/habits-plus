import { useEffect, useMemo, useState } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { cn } from '#/lib/utils'
import { formatIndonesianDate, toIsoDate } from '#/server/date'

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

type Props = {
  value: string
  onChange: (value: string) => void
  populatedDates?: ReadonlyArray<string>
  onVisibleMonthChange?: (month: string) => void
}

function startOfMonthGrid(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const mondayIndex = (first.getDay() + 6) % 7
  first.setDate(first.getDate() - mondayIndex)
  return first
}

export function DatePicker({
  value,
  onChange,
  populatedDates = [],
  onVisibleMonthChange,
}: Props) {
  const selected = new Date(value)
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
  const populatedDateSet = useMemo(
    () => new Set(populatedDates),
    [populatedDates],
  )

  useEffect(() => {
    setView(new Date(selected.getFullYear(), selected.getMonth(), 1))
  }, [selected.getFullYear(), selected.getMonth()])

  useEffect(() => {
    const month = `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, '0')}`
    onVisibleMonthChange?.(month)
  }, [onVisibleMonthChange, view])

  function moveMonth(offset: number) {
    setView(new Date(view.getFullYear(), view.getMonth() + offset, 1))
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className="w-full max-w-full gap-2 rounded-full bg-card sm:w-56 sm:min-w-56 sm:max-w-56 sm:shrink-0"
          >
            <CalendarIcon className="text-muted-foreground" />
            <span>{formatIndonesianDate(value)}</span>
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
            onClick={() => moveMonth(-1)}
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
            onClick={() => moveMonth(1)}
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
            const isWeekend = date.getDay() === 0 || date.getDay() === 6
            const isOutside = date.getMonth() !== view.getMonth()
            const isSelected = iso === value
            const isPopulated = populatedDateSet.has(iso)

            return (
              <Button
                key={iso}
                type="button"
                variant={isSelected ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => onChange(iso)}
                className={cn(
                  'relative mx-auto',
                  isOutside && 'opacity-40',
                  isWeekend && !isSelected && 'text-destructive',
                )}
              >
                {date.getDate()}
                {isPopulated && (
                  <span
                    aria-label="Ada data"
                    className={cn(
                      'absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand-orange',
                      isSelected && 'bg-primary-foreground',
                    )}
                  />
                )}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
