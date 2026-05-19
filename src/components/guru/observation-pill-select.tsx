import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { Frequency } from '#/data'
import { frequencyLabels } from '#/data'

const options: Array<Frequency> = ['tidak-terlihat', 'terlihat-sesekali', 'sering']

type Props = {
  value: Frequency
  onChange: (v: Frequency) => void
}

export function ObservationPillSelect({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Frequency)}>
      <SelectTrigger className="h-7 min-w-32 rounded-full border-transparent bg-brand-pill-teal text-xs text-brand-pill-teal-foreground">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {frequencyLabels[opt]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
