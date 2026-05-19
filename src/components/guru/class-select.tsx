import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { ClassRoom } from '#/data'

type Props = {
  classes: Array<ClassRoom>
  value: string
  onChange: (id: string) => void
}

export function ClassSelect({ classes, value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32 rounded-full bg-card">
        <SelectValue placeholder="Pilih kelas" />
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
