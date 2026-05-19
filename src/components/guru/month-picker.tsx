import { CalendarIcon, ChevronDown } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

type Props = {
  value: string
  onChange?: (value: string) => void
  showIcon?: boolean
}

export function MonthPicker({ value, onChange, showIcon = false }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="lg" className="gap-2 rounded-full bg-card">
            <span>{value}</span>
            {showIcon ? (
              <CalendarIcon className="text-muted-foreground" />
            ) : (
              <ChevronDown className="text-muted-foreground" />
            )}
          </Button>
        }
      />
      <PopoverContent className="w-48 p-1">
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((m) => {
            const label = `${m} 2026`
            const isActive = value === label
            return (
              <Button
                key={m}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onChange?.(label)}
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
