import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { Frequency } from '#/data'
import { frequencyLabels } from '#/data'
import { cn } from '#/lib/utils'

const options: Array<Frequency> = [
  'tidak-terlihat',
  'terlihat-sesekali',
  'sering',
]
const unmonitoredValue = 'belum-dipantau'

type Props = {
  value: Frequency | null
  onChange: (v: Frequency | null) => void
  label: string
  className?: string
}

export function ObservationPillSelect({
  value,
  onChange,
  label,
  className,
}: Props) {
  return (
    <Select
      value={value ?? unmonitoredValue}
      onValueChange={(nextValue) => {
        if (nextValue === unmonitoredValue) {
          onChange(null)
          return
        }
        const option = options.find((candidate) => candidate === nextValue)
        if (option) onChange(option)
      }}
    >
      <SelectTrigger
        aria-label={label}
        className={cn(
          'h-7 min-w-32 rounded-full border-transparent bg-brand-pill-teal text-xs text-brand-pill-teal-foreground',
          className,
        )}
      >
        <SelectValue>
          {value ? frequencyLabels[value] : 'Belum Dipantau'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={unmonitoredValue} className="min-h-11 lg:min-h-0">
          Belum Dipantau
        </SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="min-h-11 lg:min-h-0">
            {frequencyLabels[opt]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
