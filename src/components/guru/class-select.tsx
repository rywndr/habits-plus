import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '#/components/ui/select'
import type { ClassRoom } from '#/server/tenant-data'

type Props = {
  classes: Array<ClassRoom>
  value: string
  onChange: (id: string) => void
}

export function ClassSelect({ classes, value, onChange }: Props) {
  const selectedClass = classes.find((c) => c.id === value)

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => nextValue && onChange(nextValue)}
    >
      <SelectTrigger className="w-32 rounded-full bg-card">
        <span className="min-w-0 flex-1 truncate text-left">
          {selectedClass?.name ?? 'Pilih kelas'}
        </span>
      </SelectTrigger>
      <SelectContent>
        {classes.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
