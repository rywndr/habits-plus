import { FormField } from '#/components/admin/entity-form-page'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '#/components/ui/select'
import type { SuperAdminSchool, SuperAdminSchoolAdmin } from '#/server/loaders'

export type SchoolAdminFormValues = Pick<
  SuperAdminSchoolAdmin,
  'schoolId' | 'name' | 'email'
> & { password: string }

type SchoolAdminFormProps = {
  schools: Array<SuperAdminSchool>
  values: SchoolAdminFormValues
  onChange: (values: SchoolAdminFormValues) => void
  idPrefix: string
  isEditing?: boolean
}

export function schoolAdminFormValues({
  schools,
  admin,
}: {
  schools: Array<SuperAdminSchool>
  admin?: SuperAdminSchoolAdmin
}): SchoolAdminFormValues {
  return {
    schoolId: admin?.schoolId ?? schools.at(0)?.id ?? '',
    name: admin?.name ?? '',
    email: admin?.email ?? '',
    password: '',
  }
}

export function SchoolAdminForm({
  schools,
  values,
  onChange,
  idPrefix,
  isEditing = false,
}: SchoolAdminFormProps) {
  const selectedSchool = schools.find((school) => school.id === values.schoolId)

  return (
    <>
      <FormField label="Sekolah" className="sm:col-span-2">
        <Select
          value={values.schoolId}
          onValueChange={(schoolId) => {
            if (schoolId) onChange({ ...values, schoolId })
          }}
        >
          <SelectTrigger className="w-full">
            <span className="min-w-0 flex-1 truncate text-left">
              {selectedSchool?.name ?? 'Pilih sekolah'}
            </span>
          </SelectTrigger>
          <SelectContent>
            {schools.map((school) => (
              <SelectItem key={school.id} value={school.id}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField htmlFor={`${idPrefix}-name`} label="Nama Admin">
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
      <FormField htmlFor={`${idPrefix}-email`} label="Email">
        <Input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          value={values.email}
          onChange={(event) =>
            onChange({ ...values, email: event.target.value })
          }
          placeholder="admin@sekolah.sch.id"
          autoComplete="email"
          required
        />
      </FormField>
      <FormField
        htmlFor={`${idPrefix}-password`}
        label={isEditing ? 'Kata sandi baru' : 'Kata sandi awal'}
        hint={isEditing ? 'Kosongkan jika kata sandi tidak diubah.' : undefined}
        className="sm:col-span-2"
      >
        <Input
          id={`${idPrefix}-password`}
          name="password"
          type="password"
          value={values.password}
          onChange={(event) =>
            onChange({ ...values, password: event.target.value })
          }
          placeholder={isEditing ? 'Tidak diubah' : 'Minimal 8 karakter'}
          autoComplete="new-password"
          minLength={isEditing && !values.password ? undefined : 8}
          required={!isEditing}
        />
      </FormField>
    </>
  )
}
