import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '#/components/ui/select'
import type { ClassRoom } from '#/server/tenant-data'

export const ALL_CLASSES = 'all'

type Props = {
  classes: Array<ClassRoom>
  value: string
  onChange: (id: string) => void
  includeAll?: boolean
}

export function ClassSelect({
  classes,
  value,
  onChange,
  includeAll = false,
}: Props) {
  const selectedClass = classes.find((c) => c.id === value)
  const label =
    includeAll && value === ALL_CLASSES
      ? 'Semua kelas'
      : (selectedClass?.name ?? 'Pilih kelas')

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => nextValue && onChange(nextValue)}
    >
      <SelectTrigger className="w-36 rounded-full bg-card">
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      </SelectTrigger>
      <SelectContent>
        {includeAll ? (
          <SelectItem value={ALL_CLASSES}>Semua kelas</SelectItem>
        ) : null}
        {classes.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
