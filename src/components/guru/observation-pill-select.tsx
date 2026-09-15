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

type Props = {
  value: Frequency
  onChange: (v: Frequency) => void
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
      value={value}
      onValueChange={(nextValue) => {
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
        <SelectValue>{frequencyLabels[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="min-h-11 lg:min-h-0">
            {frequencyLabels[opt]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
