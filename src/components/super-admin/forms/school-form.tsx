import { FormField } from '#/components/admin/entity-form-page'
import { Input } from '#/components/ui/input'
import type { SuperAdminSchool } from '#/server/loaders'

export type SchoolFormValues = Pick<SuperAdminSchool, 'name' | 'region'>

type SchoolFormProps = {
  values: SchoolFormValues
  onChange: (values: SchoolFormValues) => void
  idPrefix: string
}

export function schoolFormValues(school?: SuperAdminSchool): SchoolFormValues {
  return {
    name: school?.name ?? '',
    region: school?.region ?? '',
  }
}

export function SchoolForm({ values, onChange, idPrefix }: SchoolFormProps) {
  return (
    <>
      <FormField htmlFor={`${idPrefix}-name`} label="Nama Sekolah">
        <Input
          id={`${idPrefix}-name`}
          name="name"
          value={values.name}
          onChange={(event) =>
            onChange({ ...values, name: event.target.value })
          }
          placeholder="SLB Negeri Contoh"
          autoComplete="organization"
          required
        />
      </FormField>
      <FormField htmlFor={`${idPrefix}-region`} label="Wilayah">
        <Input
          id={`${idPrefix}-region`}
          name="region"
          value={values.region}
          onChange={(event) =>
            onChange({ ...values, region: event.target.value })
          }
          placeholder="Kota Batam"
          autoComplete="address-level2"
          required
        />
      </FormField>
    </>
  )
}
