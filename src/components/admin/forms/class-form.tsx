import { FormField } from '#/components/admin/entity-form-page'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '#/components/ui/select'
import type { AppUser, ClassRoom } from '#/server/tenant-data'

export type ClassFormValues = {
  name: ClassRoom['name']
  teacherId: string
}

type ClassFormProps = {
  teachers: Array<AppUser>
  values: ClassFormValues
  onChange: (values: ClassFormValues) => void
  idPrefix: string
}

export function classFormValues(klass?: ClassRoom): ClassFormValues {
  return {
    name: klass?.name ?? '',
    teacherId: klass?.teacherId ?? 'none',
  }
}

export function ClassForm({
  teachers,
  values,
  onChange,
  idPrefix,
}: ClassFormProps) {
  const selectedTeacher = teachers.find(
    (teacher) => teacher.id === values.teacherId,
  )

  return (
    <>
      <FormField htmlFor={`${idPrefix}-name`} label="Nama Kelas">
        <Input
          id={`${idPrefix}-name`}
          name="name"
          value={values.name}
          onChange={(event) =>
            onChange({ ...values, name: event.target.value })
          }
          placeholder="VII A"
          autoComplete="off"
          required
        />
      </FormField>
      <FormField label="Guru">
        <Select
          value={values.teacherId}
          onValueChange={(teacherId) =>
            onChange({ ...values, teacherId: teacherId || 'none' })
          }
        >
          <SelectTrigger className="w-full">
            <span className="min-w-0 flex-1 truncate text-left">
              {values.teacherId === 'none'
                ? 'Belum ditugaskan'
                : (selectedTeacher?.name ?? 'Pilih guru')}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Belum ditugaskan</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </>
  )
}
