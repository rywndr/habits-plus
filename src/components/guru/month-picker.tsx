import {
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { formatIndonesianMonth } from '#/server/date'

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

type Props = {
  value: string
  onChange?: (value: string) => void
  showIcon?: boolean
}

export function MonthPicker({ value, onChange, showIcon = false }: Props) {
  const selectedYear = Number(value.slice(0, 4)) || new Date().getFullYear()
  const selectedMonth = Number(value.slice(5, 7)) || new Date().getMonth() + 1
  const [year, setYear] = useState(selectedYear)
  const label = /^\d{4}-\d{2}$/.test(value)
    ? formatIndonesianMonth(`${value}-01`)
    : value

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className="gap-2 rounded-full bg-card"
          >
            <span>{label}</span>
            {showIcon ? (
              <CalendarIcon className="text-muted-foreground" />
            ) : (
              <ChevronDown className="text-muted-foreground" />
            )}
          </Button>
        }
      />
      <PopoverContent className="w-56 p-2">
        <div className="mb-2 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Tahun sebelumnya"
            onClick={() => setYear((current) => current - 1)}
          >
            <ChevronLeft />
          </Button>
          <span className="font-heading text-sm font-semibold">{year}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Tahun berikutnya"
            onClick={() => setYear((current) => current + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((m, index) => {
            const nextValue = `${year}-${String(index + 1).padStart(2, '0')}`
            const isActive =
              value === nextValue ||
              (!/^\d{4}-\d{2}$/.test(value) &&
                selectedMonth === index + 1 &&
                selectedYear === year)
            return (
              <Button
                key={m}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onChange?.(nextValue)}
                className="text-xs"
              >
                {m.slice(0, 3)}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
