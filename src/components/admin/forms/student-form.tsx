import { FormField } from '#/components/admin/entity-form-page'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '#/components/ui/select'
import type { ClassRoom, Gender, Student } from '#/server/tenant-data'

export type StudentFormValues = Pick<
  Student,
  'nisn' | 'name' | 'classId' | 'gender'
>

type StudentFormProps = {
  classes: Array<ClassRoom>
  values: StudentFormValues
  onChange: (values: StudentFormValues) => void
  idPrefix: string
}

export function studentFormValues(
  classes: Array<ClassRoom>,
  student?: Student,
): StudentFormValues {
  return {
    nisn: student?.nisn ?? '',
    name: student?.name ?? '',
    classId: student?.classId ?? classes.at(0)?.id ?? '',
    gender: student?.gender ?? 'L',
  }
}

function isGender(value: string | null): value is Gender {
  return value === 'L' || value === 'P'
}

export function StudentForm({
  classes,
  values,
  onChange,
  idPrefix,
}: StudentFormProps) {
  const selectedClass = classes.find((klass) => klass.id === values.classId)

  return (
    <>
      <FormField htmlFor={`${idPrefix}-nisn`} label="NISN">
        <Input
          id={`${idPrefix}-nisn`}
          name="nisn"
          value={values.nisn}
          onChange={(event) =>
            onChange({ ...values, nisn: event.target.value })
          }
          placeholder="20268xxx"
          autoComplete="off"
          required
        />
      </FormField>
      <FormField htmlFor={`${idPrefix}-name`} label="Nama">
        <Input
          id={`${idPrefix}-name`}
          name="name"
          value={values.name}
          onChange={(event) =>
            onChange({ ...values, name: event.target.value })
          }
          placeholder="Nama lengkap"
          autoComplete="name"
          required
        />
      </FormField>
      <FormField label="Kelas">
        <Select
          value={values.classId}
          onValueChange={(classId) => {
            if (classId) onChange({ ...values, classId })
          }}
        >
          <SelectTrigger className="w-full">
            <span className="min-w-0 flex-1 truncate text-left">
              {selectedClass?.name ?? 'Pilih kelas'}
            </span>
          </SelectTrigger>
          <SelectContent>
            {classes.map((klass) => (
              <SelectItem key={klass.id} value={klass.id}>
                {klass.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Jenis Kelamin">
        <Select
          value={values.gender}
          onValueChange={(gender) => {
            if (isGender(gender)) onChange({ ...values, gender })
          }}
        >
          <SelectTrigger className="w-full">
            <span className="min-w-0 flex-1 truncate text-left">
              {values.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="L">Laki-laki</SelectItem>
            <SelectItem value="P">Perempuan</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </>
  )
}
